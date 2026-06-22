"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useSettingsStore } from "@/stores/useSettingsStore"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, ArrowLeft, ShieldAlert, KeyRound } from "lucide-react"
import { App as CapacitorApp } from "@capacitor/app"
import { Numpad } from "@/components/ui/Numpad";
import { StatusBar, Style } from "@capacitor/status-bar"
import { NavigationBar } from "@capgo/capacitor-navigation-bar"
import { useTheme } from "next-themes"
import { ToastContainer } from "@/components/ui/Toast"
import { BottomNavigation } from "@/components/layout/BottomNavigation"
import { hashSecurityAnswer, cn } from "@/lib/utils"
import { ErrorBoundary } from "@/components/ErrorBoundary"

import HomeView from "@/components/views/HomeView"
import GoalsView from "@/components/views/GoalsView"
import TransactionsView from "@/components/views/TransactionsView"
import StatisticsView from "@/components/views/StatisticsView"
import SettingsView from "@/components/views/SettingsView"
import CreateTargetView from "@/components/views/CreateTargetView"
import TargetDetailView from "@/components/views/TargetDetailView"
import SecurityFlowsView from "@/components/views/SecurityFlowsView"
export function AppWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true)
  const { settings, loadSettings, isLocked, authenticate, setLocked } = useSettingsStore()
  const [pinInput, setPinInput] = useState("")
  const [pinError, setPinError] = useState(false)
  const { resolvedTheme } = useTheme()
  const lastBackgroundTime = useRef<number | null>(null)
  
  // Tab State System for instant Android Navigation
  const [activeTab, setActiveTab] = useState('home')
  const [activeTargetId, setActiveTargetId] = useState<string | undefined>()
  const activeTabRef = useRef(activeTab)

  const handleNavigate = (tab: string, targetId?: string) => {
    setActiveTab(tab)
    if (targetId) setActiveTargetId(targetId)
  }

  // Keyboard detection — hide BottomNavigation when soft keyboard is open
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      // When keyboard opens on Android, visualViewport.height shrinks
      // while window.innerHeight stays the same.
      // Threshold: if viewport is < 75% of window height, keyboard is likely open.
      const ratio = vv.height / window.innerHeight;
      setIsKeyboardVisible(ratio < 0.75);
    };

    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  // Keep activeTabRef updated
  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

  useEffect(() => {
    loadSettings()
    const timer = setTimeout(() => setShowSplash(false), 1500)
    
    // Capacitor Back Button logic
    let backListener: any = null;
    let stateListener: any = null;
    const setupCapacitor = async () => {
      try {
        backListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          // Allow sub-components to intercept back button (e.g. modals)
          const event = new CustomEvent('app-back-button', { cancelable: true });
          const isCanceled = !window.dispatchEvent(event);
          if (isCanceled) return;
          
          // Logic for Back Button in SPA:
          if (activeTabRef.current === 'create_target' || activeTabRef.current === 'target_detail') {
            setActiveTab('home');
          } else if (activeTabRef.current !== 'home') {
            setActiveTab('home');
          } else {
            CapacitorApp.exitApp();
          }
        });

        // Auto Lock Logic
        stateListener = await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
          if (!isActive) {
            lastBackgroundTime.current = Date.now();
          } else {
            if (lastBackgroundTime.current) {
              const diff = Date.now() - lastBackgroundTime.current;
              // 3 minutes threshold (180,000 ms)
              if (diff > 180000) {
                const currentSettings = useSettingsStore.getState().settings;
                if (currentSettings?.pin) {
                  setLocked(true);
                }
              }
              lastBackgroundTime.current = null;
            }
          }
        });
      } catch (err) {
        // Ignore if not running in Capacitor environment
      }
    };
    setupCapacitor();

    return () => {
      clearTimeout(timer)
      if (backListener) backListener.remove();
      if (stateListener) stateListener.remove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Adaptive Status Bar & Navigation Bar
  useEffect(() => {
    const applyTheme = async () => {
      const isDark = resolvedTheme === "dark";
      
      // Update Meta Theme Color (Affects Nav Bar on modern Android)
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', isDark ? '#080f1e' : '#f0f7ff');
      }

      try {
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setBackgroundColor({ color: '#00000000' });
        // Assume gradient header for main views
        await StatusBar.setStyle({ style: Style.Dark });
        
        // Navigation bar matches --background from globals.css
        await NavigationBar.setNavigationBarColor({
          color: isDark ? '#080f1e' : '#f0f7ff',
          darkButtons: !isDark
        });
      } catch (e) {
        // ignore — runs gracefully if plugins are not available
      }
    }
    applyTheme();
  }, [resolvedTheme]);

  const handlePinNumpadPress = useCallback((num: string) => {
    if (pinInput.length < 6) {
      const newPin = pinInput + num;
      setPinInput(newPin);
      setPinError(false);
      // Auto-submit if 6 digits are entered
      if (newPin.length === 6 && settings?.pin === newPin) {
        authenticate();
        setPinInput("");
        setPinError(false);
      } else if (newPin.length === 6) {
        setPinError(true);
        setPinInput("");
      }
    }
  }, [pinInput, settings?.pin, authenticate]);

  const handlePinNumpadDelete = useCallback(() => {
    setPinInput(p => p.slice(0, -1));
    setPinError(false);
  }, []);

  const handlePinSubmit = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (settings?.pin === pinInput) {
      authenticate()
      setPinInput("")
      setPinError(false)
    } else {
      setPinError(true)
      setPinInput("")
    }
  }, [pinInput, settings?.pin, authenticate]);

  // --- Lupa PIN Flow ---
  const [forgotMode, setForgotMode] = useState(false)
  const [secAnswer, setSecAnswer] = useState("")
  const [forgotError, setForgotError] = useState("")
  const [retries, setRetries] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  
  const [resetMode, setResetMode] = useState(false)
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [resetStep, setResetStep] = useState<1 | 2>(1)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(c => c - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [cooldown])

  // Handle Android back button when in forgot/reset PIN flow
  useEffect(() => {
    const handleBackInForgot = (e: Event) => {
      if (resetMode) {
        e.preventDefault();
        setResetMode(false);
        setForgotMode(true);
        setNewPin("");
        setConfirmPin("");
        setResetStep(1);
        return;
      }
      if (forgotMode) {
        e.preventDefault();
        setForgotMode(false);
        setSecAnswer("");
        setForgotError("");
      }
    };
    window.addEventListener('app-back-button', handleBackInForgot);
    return () => window.removeEventListener('app-back-button', handleBackInForgot);
  }, [forgotMode, resetMode])

  const handleForgotSubmit = useCallback(async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (cooldown > 0) return
    
    if (!secAnswer.trim()) {
      setForgotError("Jawaban tidak boleh kosong.")
      return
    }

    const hashed = await hashSecurityAnswer(secAnswer)
    if (hashed === settings?.securityAnswer) {
      setForgotMode(false)
      setSecAnswer("")
      setForgotError("")
      setRetries(0)
      setResetMode(true)
    } else {
      const newRetries = retries + 1
      setRetries(newRetries)
      setSecAnswer("")
      if (newRetries >= 5) {
        setCooldown(30)
        setForgotError("Terlalu banyak percobaan. Tunggu 30 detik.")
      } else {
        setForgotError(`Jawaban salah. Percobaan tersisa: ${5 - newRetries}`)
      }
    }
  }, [cooldown, secAnswer, retries, settings?.securityAnswer]);

  const handleResetSubmit = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (resetStep === 1) {
      if (newPin.length === 6) setResetStep(2)
    } else {
      if (newPin === confirmPin) {
        useSettingsStore.getState().updateSettings({ pin: newPin })
        authenticate()
        setResetMode(false)
        setNewPin("")
        setConfirmPin("")
        setResetStep(1)
      } else {
        setForgotError("PIN tidak cocok. Silakan coba lagi.")
        setConfirmPin("")
        setResetStep(1)
        setNewPin("")
      }
    }
  }, [resetStep, newPin, confirmPin, authenticate]);

  const handleResetNumpadPress = useCallback((num: string) => {
    if (resetStep === 1) {
      if (newPin.length < 6) setNewPin(p => p + num)
    } else {
      if (confirmPin.length < 6) setConfirmPin(p => p + num)
    }
    setForgotError("")
  }, [resetStep, newPin.length, confirmPin.length]);

  const handleResetNumpadDelete = useCallback(() => {
    if (resetStep === 1) {
      setNewPin(p => p.slice(0, -1))
    } else {
      setConfirmPin(p => p.slice(0, -1))
    }
    setForgotError("")
  }, [resetStep]);

  const appVisible = !showSplash && !(isLocked && settings?.pin)

  return (
    <ErrorBoundary>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            suppressHydrationWarning
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
            style={{ background: "linear-gradient(135deg, #003B73 0%, #00529C 50%, #0095FF 100%)" }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
          >
            <div suppressHydrationWarning className="absolute -top-32 -left-32 w-80 h-80 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)" }} />
            <div suppressHydrationWarning className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,149,255,0.35) 0%, transparent 70%)" }} />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center relative z-10"
            >
              <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl mb-6 overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.25)" }}>
                <img src="/logo.jpg" alt="Sakuin Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-white" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>Sakuin</h1>
              <p className="font-medium text-sm tracking-wide" style={{ color: "rgba(255,255,255,0.80)" }}>Lebih dari sekadar tabungan</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!showSplash && isLocked && settings?.pin && (
          <motion.div
            key="lock"
            className="fixed inset-0 z-[90] flex flex-col text-white overflow-hidden"
            style={{ background: "linear-gradient(135deg, #003B73 0%, #00529C 50%, #0095FF 100%)" }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)" }} />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,149,255,0.2) 0%, transparent 70%)" }} />

            {/* Inner content */}
            <div
              className="flex flex-col justify-between min-h-[100dvh] p-6 overflow-hidden relative z-10 w-full"
              style={{
                paddingTop: "max(24px, env(safe-area-inset-top))",
                paddingBottom: "max(24px, env(safe-area-inset-bottom))",
              }}
            >
              <div className="flex-1 flex flex-col items-center justify-center gap-y-4 w-full max-w-xs mx-auto mt-4">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center overflow-hidden shadow-sm border border-white/20">
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold text-white">Masukkan PIN</h2>
                  <p className="text-white/70 text-sm max-w-xs">
                    Masukkan 6 digit PIN untuk membuka Sakuin.
                  </p>
                </div>

                <div className="w-full space-y-2 mt-2">
                  <div className="flex justify-center space-x-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={false}
                        animate={{
                          scale: i < pinInput.length ? 1.1 : 1,
                          backgroundColor: i < pinInput.length ? "#ffffff" : "rgba(255, 255, 255, 0.2)",
                          boxShadow: i < pinInput.length ? "0 0 10px rgba(255, 255, 255, 0.8)" : "0 0 0px rgba(255, 255, 255, 0)"
                        }}
                        transition={{ type: "tween", ease: "easeOut", duration: 0.1 }}
                        className="w-4 h-4 rounded-full"
                      />
                    ))}
                  </div>

                  <div className="h-8 flex items-center justify-center">
                    <AnimatePresence>
                      {pinError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="text-red-300 text-center text-sm font-medium"
                        >
                          PIN yang dimasukkan salah. Coba lagi.
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handlePinSubmit(e)
                    }}
                    disabled={pinInput.length !== 6}
                    className="w-full h-12 bg-white text-[#00529C] rounded-full font-bold text-base disabled:opacity-40 transition-opacity shadow-lg active:scale-95"
                  >
                    Buka Kunci
                  </button>
                </div>
              </div>

              <div className="shrink-0 w-full max-w-xs mx-auto pb-2">
                <Numpad onPress={handlePinNumpadPress} onDelete={handlePinNumpadDelete} />
                {settings?.securityQuestion && (
                  <button
                    onClick={() => setForgotMode(true)}
                    className="text-xs text-center text-blue-300 hover:text-white underline mt-6 cursor-pointer block w-full z-50"
                  >
                    Lupa PIN? Klik di sini
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

          {!showSplash && isLocked && settings?.pin && forgotMode && (
            <motion.div
              key="forgot"
              className="fixed inset-0 z-[95] flex flex-col text-white overflow-hidden"
              style={{ background: "linear-gradient(135deg, #003B73 0%, #00529C 50%, #0095FF 100%)" }}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.2 }}
            >
              {/* Fixed header */}
              <div
                className="flex items-center px-4 pb-4 relative z-10 shrink-0"
                style={{ paddingTop: "max(24px, env(safe-area-inset-top))" }}
              >
                <button
                  onClick={() => { setForgotMode(false); setSecAnswer(""); setForgotError(""); }}
                  className="p-2 rounded-full text-white/80 hover:bg-white/10 transition-colors mr-3"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold text-white">Verifikasi Identitas</h2>
              </div>

              {/* Scrollable body */}
              <div
                className="flex-1 flex flex-col px-6 relative z-10 overflow-y-auto overscroll-contain"
                style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
              >
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xs mx-auto py-6">
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center text-white shadow-sm border border-white/20">
                      <ShieldAlert className="w-10 h-10" />
                    </div>
                  </div>

                  <p className="text-center text-sm text-white/75 mb-8">
                    Jawab pertanyaan keamanan untuk mereset PIN Anda.
                  </p>

                  <div className="space-y-4 w-full">
                    <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
                      <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider mb-1.5">Pertanyaan Keamanan</p>
                      <p className="text-sm font-semibold text-white leading-snug">{settings.securityQuestion}</p>
                    </div>

                    <div>
                      <input
                        type="text"
                        autoFocus
                        disabled={cooldown > 0}
                        placeholder="Ketik jawaban Anda..."
                        className="w-full h-14 bg-white/10 rounded-2xl border-2 border-white/20 focus:border-white/60 px-4 outline-none disabled:opacity-50 text-sm text-white placeholder-white/40 transition-colors"
                        value={secAnswer}
                        onChange={(e) => { setSecAnswer(e.target.value); setForgotError(""); }}
                      />
                    </div>

                    <AnimatePresence>
                      {forgotError && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="bg-red-500/20 border border-red-300/30 rounded-xl p-3 text-sm text-red-200 font-medium text-center"
                        >{forgotError}</motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleForgotSubmit(e)
                      }}
                      disabled={!secAnswer.trim() || cooldown > 0}
                      className="w-full h-12 bg-white text-[#00529C] rounded-full font-bold text-base disabled:opacity-40 transition-opacity active:scale-95 shadow-lg"
                    >
                      {cooldown > 0 ? `Tunggu ${cooldown}s...` : "Verifikasi"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {!showSplash && isLocked && settings?.pin && resetMode && (
            <motion.div
              key="reset"
              className="fixed inset-0 z-[96] flex flex-col text-white overflow-hidden"
              style={{ background: "linear-gradient(135deg, #003B73 0%, #00529C 50%, #0095FF 100%)" }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Inner layout: header top, numpad bottom */}
              <div
                className="w-full h-full flex flex-col justify-between p-6 overflow-hidden"
                style={{
                  paddingTop: "max(24px, env(safe-area-inset-top))",
                  paddingBottom: "max(16px, env(safe-area-inset-bottom))",
                }}
              >
                {/* Top: header + indicators */}
                <div className="flex-1 flex flex-col items-center gap-y-3 mt-2">
                  <div className="flex items-center w-full">
                    <button
                      onClick={() => {
                        setResetMode(false);
                        setResetStep(1);
                        setNewPin("");
                        setConfirmPin("");
                      }}
                      className="p-2 rounded-full text-white/80 hover:bg-white/10 transition-colors mr-3"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-bold text-white">Buat PIN Baru</h2>
                  </div>

                  <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 mt-2">
                    <KeyRound className="w-7 h-7 text-white" />
                  </div>

                  <p className="text-white/70 text-sm text-center">
                    {resetStep === 1 ? "Masukkan 6 digit PIN baru Anda." : "Konfirmasi PIN baru Anda."}
                  </p>

                  <div className="flex justify-center space-x-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={false}
                        animate={{
                          scale: i < (resetStep === 1 ? newPin.length : confirmPin.length) ? 1.1 : 1,
                          backgroundColor: i < (resetStep === 1 ? newPin.length : confirmPin.length) ? "#ffffff" : "rgba(255,255,255,0.2)",
                          boxShadow: i < (resetStep === 1 ? newPin.length : confirmPin.length) ? "0 0 10px rgba(255,255,255,0.8)" : "0 0 0px rgba(255,255,255,0)"
                        }}
                        transition={{ type: "tween", ease: "easeOut", duration: 0.1 }}
                        className="w-4 h-4 rounded-full"
                      />
                    ))}
                  </div>

                  <div className="h-8 flex items-center justify-center w-full">
                    <AnimatePresence>
                      {forgotError && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="w-full bg-red-500/20 border border-red-300/30 rounded-xl p-2.5 text-sm text-red-200 font-medium text-center"
                        >{forgotError}</motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleResetSubmit(e)
                    }}
                    disabled={(resetStep === 1 ? newPin.length : confirmPin.length) !== 6}
                    className="w-full h-12 bg-white text-[#00529C] rounded-full font-bold text-base disabled:opacity-40 transition-opacity shadow-lg active:scale-95"
                  >
                    {resetStep === 1 ? "Lanjut →" : "Simpan & Buka"}
                  </button>
                </div>

                {/* Bottom: numpad */}
                <div className="mt-auto w-full max-w-md mx-auto pb-2">
                  <Numpad onPress={handleResetNumpadPress} onDelete={handleResetNumpadDelete} />
                </div>
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      <div
        className={appVisible ? "flex flex-col" : "hidden"}
        style={{ position: 'fixed', inset: 0 }}
      >
        <main className="flex-1 min-h-0 overflow-hidden relative">
          {/* NOTE: Use CSS display:block/hidden instead of conditional rendering (&&)
              to prevent Next.js hydration mismatch in Android WebView.
              Mount/unmount triggers re-hydration, which causes hard restart in Capacitor. */}
          
          <div className={cn("absolute inset-0 flex flex-col", activeTab === 'home' ? 'flex' : 'hidden')}>
            <ErrorBoundary fallback={<div className="p-4 text-center text-red-500">Error in Home View</div>}>
              <HomeView activeTab={activeTab} onNavigate={handleNavigate} />
            </ErrorBoundary>
          </div>
          
          <div className={cn("absolute inset-0 flex flex-col", activeTab === 'goals' ? 'flex' : 'hidden')}>
            <ErrorBoundary fallback={<div className="p-4 text-center text-red-500">Error in Goals View</div>}>
              <GoalsView activeTab={activeTab} onNavigate={handleNavigate} />
            </ErrorBoundary>
          </div>
          
          <div className={cn("absolute inset-0 flex flex-col", activeTab === 'transactions' ? 'flex' : 'hidden')}>
            <ErrorBoundary fallback={<div className="p-4 text-center text-red-500">Error in Transactions View</div>}>
              <TransactionsView activeTab={activeTab} onNavigate={handleNavigate} />
            </ErrorBoundary>
          </div>
          
          <div className={cn("absolute inset-0 flex flex-col", activeTab === 'statistics' ? 'flex' : 'hidden')}>
            <ErrorBoundary fallback={<div className="p-4 text-center text-red-500">Error in Statistics View</div>}>
              {activeTab === 'statistics' ? <StatisticsView activeTab={activeTab} onNavigate={handleNavigate} /> : null}
            </ErrorBoundary>
          </div>
          
          <div className={cn("absolute inset-0 flex flex-col", activeTab === 'settings' ? 'flex' : 'hidden')}>
            <ErrorBoundary fallback={<div className="p-4 text-center text-red-500">Error in Settings View</div>}>
              <SettingsView activeTab={activeTab} onNavigate={handleNavigate} />
            </ErrorBoundary>
          </div>

          <div className={cn("absolute inset-0 flex flex-col z-30 bg-background", (activeTab === 'create_target' || activeTab === 'edit_target') ? 'flex' : 'hidden')}>
            <ErrorBoundary fallback={<div className="p-4 text-center text-red-500">Error in Create Target View</div>}>
              <CreateTargetView activeTab={activeTab} onNavigate={handleNavigate} targetId={activeTargetId} />
            </ErrorBoundary>
          </div>

          <div className={cn("absolute inset-0 overflow-y-auto z-30 bg-background", activeTab === 'target_detail' ? 'block' : 'hidden')}>
            <ErrorBoundary fallback={<div className="p-4 text-center text-red-500">Error in Target Detail View</div>}>
              <TargetDetailView activeTab={activeTab} onNavigate={handleNavigate} targetId={activeTargetId} />
            </ErrorBoundary>
          </div>

          <div className={cn("absolute inset-0 overflow-y-auto z-40 bg-background", activeTab.startsWith('security_') ? 'block' : 'hidden')}>
            <ErrorBoundary fallback={<div className="p-4 text-center text-red-500">Error in Security Flow View</div>}>
              <SecurityFlowsView activeTab={activeTab} onNavigate={handleNavigate} />
            </ErrorBoundary>
          </div>
        </main>

        {!isKeyboardVisible && activeTab !== 'create_target' && activeTab !== 'target_detail' && activeTab !== 'edit_target' && !activeTab.startsWith('security_') && <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />}
        <ToastContainer />
        
        {/* Render children in hidden div to prevent Next.js hydration crashes */}
        <div className="hidden" aria-hidden="true">
          {children}
        </div>
      </div>
    </ErrorBoundary>
  )
}
