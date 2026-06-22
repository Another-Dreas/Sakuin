"use client";

import { useState, useCallback, useEffect } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Lock, Shield, KeyRound, CheckCircle2, ShieldAlert, Trash2 } from "lucide-react";
import { Numpad } from "@/components/ui/Numpad";
import { cn, hashSecurityAnswer } from "@/lib/utils";

const SECURITY_QUESTIONS = [
  "Siapa nama hewan peliharaan pertama Anda?",
  "Di kota mana Anda dilahirkan?",
  "Nama guru favorit Anda sewaktu sekolah?",
  "Apa makanan favorit Anda sewaktu kecil?",
  "Apa nama sekolah dasar Anda?",
  "Nama panggilan masa kecil Anda?",
  "__custom__",
];

interface Props {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export default function SecurityFlowsView({ activeTab, onNavigate }: Props) {
  const { settings, updateSettings } = useSettingsStore();
  const [step, setStep] = useState(1);
  const [pinPhase, setPinPhase] = useState<"create" | "confirm" | "verify">("verify");
  
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  
  const [question, setQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [customQ, setCustomQ] = useState("");
  const [answer, setAnswer] = useState("");
  
  const [error, setError] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Reset state when entering the tab
  useEffect(() => {
    if (activeTab.startsWith("security_")) {
      setStep(1);
      setPin("");
      setConfirmPin("");
      setAnswer("");
      setError("");
      if (activeTab === "security_create_pin") {
        setPinPhase("create");
      } else {
        setPinPhase("verify");
      }
    }
  }, [activeTab]);

  const handleBack = () => {
    onNavigate("settings");
  };

  const handleNumpadPress = (num: string) => {
    if (error) setError("");
    
    if (activeTab === "security_create_pin") {
      if (pinPhase === "create" && pin.length < 6) setPin(p => p + num);
      if (pinPhase === "confirm" && confirmPin.length < 6) setConfirmPin(p => p + num);
    } else if (activeTab === "security_change_pin") {
      // verify = user enters old PIN (into `pin`)
      // create = user enters new PIN (into `pin`, freshly reset)
      // confirm = user re-enters new PIN (into `confirmPin`)
      if (pinPhase === "verify" && pin.length < 6) setPin(p => p + num);
      if (pinPhase === "create" && pin.length < 6) setPin(p => p + num);
      if (pinPhase === "confirm" && confirmPin.length < 6) setConfirmPin(p => p + num);
    } else {
      // Delete flow: only verify step
      if (pin.length < 6) setPin(p => p + num);
    }
  };

  const handleNumpadDelete = () => {
    if (error) setError("");
    
    if (activeTab === "security_create_pin") {
      if (pinPhase === "create") setPin(p => p.slice(0, -1));
      if (pinPhase === "confirm") setConfirmPin(p => p.slice(0, -1));
    } else if (activeTab === "security_change_pin") {
      if (pinPhase === "verify") setPin(p => p.slice(0, -1));
      if (pinPhase === "create") setPin(p => p.slice(0, -1));
      if (pinPhase === "confirm") setConfirmPin(p => p.slice(0, -1));
    } else {
      setPin(p => p.slice(0, -1));
    }
  };

  const handleSubmitPin = () => {
    if (activeTab === "security_create_pin") {
      if (pinPhase === "create") {
        if (pin.length !== 6) { setError("PIN harus 6 digit"); return; }
        // Preserve `pin` (the created PIN) and reset confirmPin before moving on
        setConfirmPin("");
        setPinPhase("confirm");
      } else {
        // pinPhase === "confirm": compare the two entries
        if (pin !== confirmPin) { setError("PIN tidak cocok"); setConfirmPin(""); return; }
        setStep(2);
      }
    } else if (activeTab === "security_change_pin") {
      if (pinPhase === "verify") {
        if (pin !== settings?.pin) { setError("PIN saat ini salah"); setPin(""); return; }
        // Old PIN verified. Reset `pin` so the new-PIN step starts fresh.
        setPin("");
        setConfirmPin("");
        setError("");
        setPinPhase("create");
      } else if (pinPhase === "create") {
        if (pin.length !== 6) { setError("PIN baru harus 6 digit"); return; }
        // Save new PIN draft into confirmPin slot, clear pin for confirm step
        setConfirmPin("");
        setPinPhase("confirm");
      } else {
        // pinPhase === "confirm": compare
        if (pin !== confirmPin) { setError("PIN tidak cocok"); setConfirmPin(""); return; }
        updateSettings({ pin });
        setStep(3);
      }
    } else if (activeTab === "security_delete_pin") {
      if (pin !== settings?.pin) { setError("PIN saat ini salah"); setPin(""); return; }
      updateSettings({ pin: null, securityQuestion: undefined, securityAnswer: undefined });
      setStep(3);
    }
  };

  const handleSubmitQuestion = async () => {
    const finalQ = question === "__custom__" ? customQ.trim() : question;
    if (!finalQ) { setError("Pertanyaan tidak boleh kosong"); return; }
    if (!answer.trim()) { setError("Jawaban tidak boleh kosong"); return; }
    
    const hashedAnswer = await hashSecurityAnswer(answer.trim());
    updateSettings({ pin, securityQuestion: finalQ, securityAnswer: hashedAnswer });
    setStep(3);
  };

  const StepIndicator = ({ maxSteps }: { maxSteps: number }) => (
    <div className="flex items-center justify-center space-x-2 mb-0">
      {Array.from({ length: maxSteps }).map((_, i) => (
        <div key={i} className={cn(
          "h-1.5 rounded-full transition-all duration-300",
        )}
        style={{
          width: i + 1 === step ? 32 : 16,
          background: i + 1 === step ? '#0057B8' : i + 1 < step ? 'rgba(0,87,184,0.35)' : 'var(--border)'
        }}
        />
      ))}
    </div>
  );

  const getHeaderTitle = () => {
    if (activeTab === "security_create_pin") return "Buat PIN Baru";
    if (activeTab === "security_change_pin") return "Ubah PIN";
    if (activeTab === "security_delete_pin") return "Hapus PIN";
    return "Keamanan";
  };

  if (!activeTab.startsWith("security_")) return null;

  // Determine which state variable drives the dot indicators and the Lanjut button
  const currentPinLen = (() => {
    if (activeTab === "security_create_pin") {
      return pinPhase === "confirm" ? confirmPin.length : pin.length;
    }
    if (activeTab === "security_change_pin") {
      // verify   -> user types old PIN into `pin`
      // create   -> user types new PIN into `pin` (freshly reset)
      // confirm  -> user re-types new PIN into `confirmPin`
      return pinPhase === "confirm" ? confirmPin.length : pin.length;
    }
    // delete_pin: single verify step, always `pin`
    return pin.length;
  })();

  return (
    <div className="w-full h-[100dvh] flex flex-col justify-between bg-background text-foreground relative overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center px-4 pb-2 pt-[max(16px,env(safe-area-inset-top))] relative z-10 shrink-0"
      >
        <button
          onClick={handleBack}
          className="p-2 rounded-full hover:bg-muted transition-colors mr-3 text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-[#102A43] dark:text-[#F8FAFC]">{getHeaderTitle()}</h2>
      </div>

      {/* Body */}
      <div 
        className="flex-1 flex flex-col w-full px-6"
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
      >
        <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col w-full">
                
                {/* Content top section */}
                <div className="flex-1 flex flex-col items-center justify-center py-2">
                  {activeTab === "security_create_pin" && (
                    <div className="mb-4">
                      <StepIndicator maxSteps={3} />
                    </div>
                  )}
                  
                  <div className="flex justify-center mb-4">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border dark:border-[#334155]", 
                      activeTab === "security_delete_pin" ? "bg-red-50 dark:bg-red-950/30 text-red-500 border-red-200 dark:border-red-900/50" : "bg-primary/10 dark:bg-[#1E293B] text-primary border-border"
                    )}>
                      {activeTab === "security_delete_pin" ? <Trash2 className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
                    </div>
                  </div>

                  <p className="text-center text-sm text-[#486581] dark:text-[#CBD5E1] mb-5">
                    {activeTab === "security_create_pin" 
                      ? (pinPhase === "confirm" ? "Masukkan kembali PIN Anda untuk konfirmasi." : "Buat PIN 6 digit untuk melindungi data Anda.")
                      : activeTab === "security_change_pin"
                        ? (pinPhase === "verify" 
                            ? "Masukkan PIN saat ini." 
                            : pinPhase === "confirm"
                              ? "Konfirmasi PIN baru Anda."
                              : "Buat PIN 6 digit baru Anda.")
                        : "Masukkan PIN saat ini untuk menonaktifkan keamanan."
                    }
                  </p>

                  <div className="flex flex-col gap-4 w-full">
                    <div className="flex justify-center space-x-4 mb-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <motion.div 
                          key={i} 
                          initial={false}
                          animate={{ scale: i < currentPinLen ? 1.1 : 1 }}
                          transition={{ duration: 0.15, ease: "easeInOut" }}
                          className={cn(
                            "w-4 h-4 rounded-full transition-colors duration-150",
                            i < currentPinLen
                              ? (activeTab === "security_delete_pin" ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]" : "bg-primary shadow-[0_0_10px_rgba(0,87,184,0.4)]")
                              : "bg-muted-foreground/30 dark:bg-muted-foreground/50"
                          )} 
                        />
                      ))}
                    </div>

                    <div className="h-10 flex items-center justify-center w-full mt-2">
                      <AnimatePresence>
                        {error && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="w-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-2.5 text-sm text-red-600 dark:text-red-400 font-medium text-center"
                          >{error}</motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      type="button"
                      onClick={handleSubmitPin}
                      disabled={currentPinLen !== 6}
                      className={cn("w-full h-14 rounded-full font-bold text-lg disabled:opacity-40 transition-opacity mt-2 shadow-lg active:scale-95 text-white",
                        activeTab === "security_delete_pin" ? "bg-red-500" : "bg-primary"
                      )}
                    >
                      Lanjut →
                    </button>
                  </div>
                </div>

                {/* Numpad pinned to bottom */}
                <div className="mt-auto w-full max-w-md mx-auto pb-4 pt-2">
                  <Numpad onPress={handleNumpadPress} onDelete={handleNumpadDelete} variant="theme" />
                </div>
              </motion.div>
            )}

            {step === 2 && activeTab === "security_create_pin" && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col items-center justify-center w-full py-4">
                <div className="mb-4">
                  <StepIndicator maxSteps={3} />
                </div>
                <div className="flex flex-col items-center text-center mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-[#1E293B] flex items-center justify-center text-primary mb-3 shrink-0 border border-border dark:border-[#334155]">
                    <Shield className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-[#102A43] dark:text-[#F8FAFC]">Pemulihan Akun</h3>
                  <p className="text-sm mt-1 text-[#486581] dark:text-[#CBD5E1]">
                    Pertanyaan ini digunakan untuk mereset PIN jika Anda lupa.
                  </p>
                </div>

                <div className="flex flex-col gap-3 w-full min-w-0">
                  <div className="w-full min-w-0">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Pilih Pertanyaan</label>
                    <div className="relative w-full">
                      <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={cn(
                          "w-full rounded-2xl px-4 py-3.5 pr-10 text-sm transition-colors cursor-pointer select-none border-2 bg-[#F8FAFC] dark:bg-[#1E293B] text-[#102A43] dark:text-[#F8FAFC]",
                          isDropdownOpen ? "border-primary" : "border-[#D9E2EC] dark:border-[#334155]"
                        )}
                      >
                        <span className="block truncate">{question === "__custom__" ? "✏️ Tulis pertanyaan sendiri..." : question}</span>
                      </div>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={cn("transition-transform", isDropdownOpen && "rotate-180")}><polyline points="6 9 12 15 18 9" /></svg>
                      </div>
                      <AnimatePresence>
                        {isDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-[60]" onClick={() => setIsDropdownOpen(false)} />
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute left-0 right-0 top-full mt-2 z-[70] bg-card border border-border rounded-xl shadow-xl max-h-[240px] overflow-y-auto">
                              <div className="flex flex-col py-1.5">
                                {SECURITY_QUESTIONS.map(q => (
                                  <button key={q} type="button" onClick={() => { setQuestion(q); setError(""); setIsDropdownOpen(false); }} className={cn("text-left px-4 py-3 text-sm transition-colors w-full", question === q ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted")}>
                                    {q === "__custom__" ? "✏️ Tulis pertanyaan sendiri..." : q}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {question === "__custom__" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="w-full">
                      <textarea
                        value={customQ} onChange={e => { setCustomQ(e.target.value); setError(""); }}
                        placeholder="Contoh: Apa nama jalan rumah masa kecil Anda?" rows={2}
                        className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none border-2 bg-[#F8FAFC] dark:bg-[#1E293B] border-[#D9E2EC] dark:border-[#334155] focus:border-primary text-[#102A43] dark:text-[#F8FAFC] placeholder-muted-foreground"
                      />
                    </motion.div>
                  )}

                  <div className="w-full">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Jawaban</label>
                    <input
                      type="text" value={answer} onChange={e => { setAnswer(e.target.value); setError(""); }}
                      placeholder="Ketik jawaban Anda..."
                      className="w-full rounded-2xl px-4 py-3.5 text-sm outline-none border-2 bg-[#F8FAFC] dark:bg-[#1E293B] border-[#D9E2EC] dark:border-[#334155] focus:border-primary text-[#102A43] dark:text-[#F8FAFC] placeholder-muted-foreground"
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-3 text-sm text-red-600 dark:text-red-400 font-medium text-center">
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button type="button" onClick={handleSubmitQuestion} disabled={!answer.trim()} className="w-full h-14 mt-4 bg-primary text-primary-foreground rounded-full font-bold text-lg disabled:opacity-40 transition-opacity shadow-lg active:scale-95">
                    Simpan
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center w-full py-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-[#1E293B] flex items-center justify-center text-primary mb-4 border border-border dark:border-[#334155]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#102A43] dark:text-[#F8FAFC]">
                  {activeTab === "security_create_pin" ? "Keamanan Aktif!" : activeTab === "security_change_pin" ? "PIN Berhasil Diubah" : "Keamanan Dinonaktifkan"}
                </h3>
                <p className="text-sm mt-1 mb-5 text-[#486581] dark:text-[#CBD5E1]">
                  {activeTab === "security_create_pin" ? "PIN dan pertanyaan keamanan berhasil disimpan." : activeTab === "security_change_pin" ? "PIN baru Anda sudah bisa digunakan." : "PIN Anda berhasil dihapus."}
                </p>
                <button type="button" onClick={handleBack} className="w-full h-14 bg-primary text-primary-foreground rounded-full font-bold text-lg transition-transform active:scale-95 shadow-lg">
                  Selesai
                </button>
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
