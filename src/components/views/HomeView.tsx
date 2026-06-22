"use client"

import { useEffect, useMemo, useState, useRef } from "react";
import { useGoalStore } from "@/stores/useGoalStore";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { formatCurrency, cn } from "@/lib/utils";
import { Currency } from "@/components/ui/Currency";
import { Card, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { GoalIcon } from "@/components/ui/IconPicker";
import { Plus, Target, Wallet, TrendingUp, CheckCircle2, Clock, Edit2, Trash2, Eye, EyeOff, X, Pencil } from "lucide-react";
import { Browser } from "@capacitor/browser";
import { motion, AnimatePresence } from "framer-motion";
import { useLongPress } from "@/hooks/useLongPress";
import type { LongPressEventData } from "@/hooks/useLongPress";
import { DeleteConfirmationModal } from "@/components/ui/Modal";
import type { Goal } from "@/lib/db";
import { getThemeStyle } from "@/lib/theme";

interface HomeViewProps {
  activeTab: string;
  onNavigate: (tab: string, targetId?: string) => void;
}

function DashboardGoalCard({ goal, i, isSelected, onLongPress, onClick, isClosest = false }: { goal: Goal, i?: number, isSelected: boolean, onLongPress: (goal: Goal, data: LongPressEventData) => void, onClick?: () => void, isClosest?: boolean }) {
  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const s = getThemeStyle(goal.themeColor ?? "blue");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      let x = 0, y = 0;
      if ('touches' in e && e.touches.length > 0) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else if ('clientX' in e) {
        x = (e as React.MouseEvent).clientX;
        y = (e as React.MouseEvent).clientY;
      }
      onLongPress(goal, { x, y, event: e });
    }, 500);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleTouchMove = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (isLongPress.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (onClick) onClick();
  };

  return (
    <motion.div initial={{ opacity: 0, y: isClosest ? 20 : 0, x: isClosest ? 0 : -15 }} animate={{ opacity: 1, y: 0, x: 0 }} transition={{ delay: isClosest ? 0.2 : 0.25 + (i || 0) * 0.07 }}>
      <div 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchMove}
        onClick={handleClick}
        onContextMenu={(e) => e.preventDefault()}
        style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}
        className="select-none cursor-pointer relative"
      >
        <Card className={cn("transition-all duration-200", 
          isSelected ? "border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[0.98] shadow-lg z-10" : "hover:shadow-md active:scale-[0.99]",
          (!isSelected && isClosest) ? "border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/10 hover:border-amber-300" : (!isSelected ? cn(s.cardBg, s.cardBorder) : "")
        )}>
          {isSelected && (
            <div className="absolute top-3 right-3 z-20">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
            </div>
          )}
          <CardContent className="p-4 flex flex-col space-y-4 pointer-events-none">
            {/* Top row: Icon, Info, Percentage */}
            <div className="flex items-center space-x-3">
              {/* Kiri: Container Icon */}
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner", 
                isClosest ? "w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" : cn(s.iconBg, s.iconColor))}>
                <GoalIcon name={goal.icon} className={isClosest ? "w-6 h-6" : "w-6 h-6"} />
              </div>
              
              {/* Tengah: Informasi Target */}
              <div className="flex-1 min-w-0">
                <h4 className={cn("font-semibold text-sm truncate", isClosest ? "" : s.textPrimary)}>{goal.name}</h4>
                <p className={cn("text-xs mt-0.5 tabular-nums", isClosest ? "text-muted-foreground" : s.textSecondary)}>
                  <Currency amount={goal.currentAmount} />
                  <span className="opacity-60"> / <Currency amount={goal.targetAmount} /></span>
                </p>
              </div>
              
              {/* Kanan: Persentase Progress */}
              <div className="text-right shrink-0">
                <span className={cn("font-bold text-base leading-none", isClosest ? "text-amber-600 dark:text-amber-400" : s.textPrimary)}>{progress.toFixed(0)}%</span>
              </div>
            </div>
            
            {/* Bawah: Progress Bar */}
            <div className={cn("w-full rounded-full overflow-hidden shadow-inner", isClosest ? "bg-amber-200 dark:bg-amber-900/50 h-2" : cn(s.progressTrack, "h-2"))}>
              <div
                className={cn("rounded-full transition-all duration-500", isClosest ? "bg-amber-500 h-2" : cn(s.progressFill, "h-2"))}
                style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

const todayStr = new Date().toLocaleDateString("id-ID", {
  weekday: "long", day: "numeric", month: "long", year: "numeric"
});

export default function Dashboard({ activeTab, onNavigate }: HomeViewProps) {
  const { goals, loadGoals, isLoading, deleteGoal } = useGoalStore();
  const { transactions, loadTransactions } = useTransactionStore();
  const isHidden = useSettingsStore(s => s.settings?.isBalanceHidden);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleLongPress = (goal: Goal, data: LongPressEventData) => {
    setIsSelectionMode(true);
    if (goal.id) {
      setSelectedGoalIds([goal.id]);
    }
  };

  const resetSelection = () => {
    setIsSelectionMode(false);
    setSelectedGoalIds([]);
  };

  useEffect(() => {
    if (selectedGoalIds.length === 0 && isSelectionMode) {
      setIsSelectionMode(false);
    }
  }, [selectedGoalIds, isSelectionMode]);

  useEffect(() => {
    if (!isSelectionMode) {
      setSelectedGoalIds([]);
    }
  }, [isSelectionMode]);

  useEffect(() => {
    if (activeTab === 'home') {
      resetSelection();
    }
  }, [activeTab]);

  const handleEdit = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (selectedGoalIds.length !== 1) return;
    const id = selectedGoalIds[0];
    resetSelection();
    onNavigate('edit_target', id);
  };

  const handleDeleteRequest = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedGoalIds.length === 0) return;
    setIsDeleting(true);
    await Promise.all(selectedGoalIds.map(id => deleteGoal(id)));
    setIsDeleting(false);
    setShowDeleteModal(false);
    setSelectedGoalIds([]);
    setIsSelectionMode(false);

    setToastMessage("Target berhasil dihapus");
    setTimeout(() => setToastMessage(""), 2000);
  };

  useEffect(() => {
    // Only load data when this tab is active to avoid unnecessary database queries
    if (activeTab === 'home') {
      loadGoals();
      loadTransactions();
    }
  }, [activeTab, loadGoals, loadTransactions]);

  const stats = useMemo(() => {
    const totalAmount = goals.reduce((s, g) => s + g.currentAmount, 0);
    const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
    const activeGoals = goals.filter((g) => g.status === "active");
    const completedGoals = goals.filter((g) => g.status === "completed");
    const overallProgress = totalTarget > 0 ? (totalAmount / totalTarget) * 100 : 0;

    // Monthly stats
    const now = new Date();
    const monthTx = transactions.filter(t => {
      const d = new Date(t.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthIn = monthTx.filter(t => t.type === "in").reduce((s, t) => s + t.amount, 0);
    const monthOut = monthTx.filter(t => t.type === "out").reduce((s, t) => s + t.amount, 0);

    // Closest to completion (active only, highest % progress)
    const closestGoal = [...activeGoals].sort((a, b) => {
      const pA = a.targetAmount > 0 ? a.currentAmount / a.targetAmount : 0;
      const pB = b.targetAmount > 0 ? b.currentAmount / b.targetAmount : 0;
      return pB - pA;
    })[0];

    // Latest goals (5 most recently active)
    const latestGoals = [...activeGoals]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    return {
      totalAmount, overallProgress,
      activeCount: activeGoals.length,
      completedCount: completedGoals.length,
      totalGoals: goals.length,
      monthIn, monthOut,
      closestGoal, latestGoals, activeGoals,
    };
  }, [goals, transactions]);

  if (isLoading && goals.length === 0 && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full overflow-y-auto pb-4 bg-background relative">

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedGoalIds([]);
          setIsSelectionMode(false);
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        count={selectedGoalIds.length}
      />

      {/* Header — matching PageHeader styles */}
      <div className="sticky top-0 z-50">
        <div
          className={cn(
            "px-4 pb-4 rounded-b-[2rem] shadow-sm relative flex-shrink-0 transition-all duration-300",
            isSelectionMode 
              ? "bg-white dark:bg-slate-900 border-b border-border"
              : "bg-[linear-gradient(135deg,#003B73_0%,#00529C_50%,#0095FF_100%)] dark:bg-[linear-gradient(135deg,#0d1a2e_0%,#112240_50%,#080f1e_100%)] border-b border-white/10 dark:border-slate-700/50"
          )}
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
        >
          {isSelectionMode ? (
            <header className="flex justify-between items-center text-foreground">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedGoalIds([]);
                  }}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <span className="text-xl font-bold">{selectedGoalIds.length} dipilih</span>
              </div>
              <div className="flex items-center gap-3">
                {selectedGoalIds.length === 1 && (
                  <button 
                    onClick={handleEdit}
                    className="p-2 rounded-full hover:bg-muted transition-colors text-blue-600"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={handleDeleteRequest}
                  className="p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-rose-600"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </header>
          ) : (
            <header className="flex justify-between items-center text-white">
              <div className="flex-1 min-w-0 px-2">
                <p className="text-[12px] text-white/80 dark:text-slate-300/80 tracking-wide font-medium mb-0.5">{todayStr}</p>
                <h1 className="text-2xl font-bold tracking-tight text-white dark:text-slate-100 leading-snug">{getGreeting()}</h1>
              </div>
              <div className="w-11 h-11 rounded-full bg-white shadow-sm overflow-hidden border-2 border-white/20 shrink-0 ml-3">
                <img src="/logo.jpg" alt="Sakuin" className="w-full h-full object-cover" />
              </div>
            </header>
          )}
        </div>
      </div>

      <div className="px-4 pt-6 pb-8 space-y-5 relative">
        {/* Hero Summary Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-r from-[#003b80] via-[#0059d6] to-[#0080ff] dark:from-[#0d1a2e] dark:via-[#112240] dark:to-[#080f1e] text-white shadow-xl shadow-black/10 dark:shadow-none border border-white/20 dark:border-slate-700/50 overflow-hidden">
          <CardContent className="p-5 relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

            <div className="flex items-center space-x-2 mb-3 opacity-80 relative z-10">
              <Wallet className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider flex-1">Total Tabungan</span>
            </div>
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h2
                className="font-extrabold tracking-tight min-w-0 leading-tight"
                style={{ fontSize: "clamp(1.25rem, 5.8vw, 1.875rem)" }}
              >
                <Currency amount={stats.totalAmount} />
              </h2>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); useSettingsStore.getState().toggleHideBalance(); }}
                className="w-11 h-11 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full transition-all active:scale-95 shrink-0 shadow-sm border border-white/10"
                aria-label={isHidden ? "Tampilkan saldo" : "Sembunyikan saldo"}
              >
                {isHidden ? <Eye className="w-[22px] h-[22px] text-white" /> : <EyeOff className="w-[22px] h-[22px] text-white" />}
              </button>
            </div>

            <div className="space-y-1.5 relative z-10">
              <div className="flex justify-between text-xs opacity-80">
                <span>Progres Keseluruhan</span>
                <span className="font-semibold">{stats.overallProgress.toFixed(1)}%</span>
              </div>
              <ProgressBar progress={stats.overallProgress} colorClass="bg-white" className="bg-blue-800/40 h-2" />
            </div>

            <div className="grid grid-cols-3 mt-5 pt-4 border-t border-blue-400/30 relative z-10 gap-2">
              <div>
                <p className="text-[10px] opacity-70 uppercase">Total</p>
                <p className="text-base font-bold">{stats.totalGoals}</p>
              </div>
              <div>
                <p className="text-[10px] opacity-70 uppercase">Aktif</p>
                <p className="text-base font-bold">{stats.activeCount}</p>
              </div>
              <div>
                <p className="text-[10px] opacity-70 uppercase">Selesai</p>
                <p className="text-base font-bold">{stats.completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Monthly Quick Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Masuk Bulan Ini</span>
            </div>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400"><Currency amount={stats.monthIn} /></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="w-4 h-4 text-rose-500 rotate-180" />
              <span className="text-xs text-muted-foreground">Keluar Bulan Ini</span>
            </div>
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400"><Currency amount={stats.monthOut} /></p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Closest Goal */}
      {stats.closestGoal && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" /> Target Terdekat
            </h3>
          </div>
          <DashboardGoalCard
            goal={stats.closestGoal}
            isSelected={isSelectionMode && !!stats.closestGoal.id && selectedGoalIds.includes(stats.closestGoal.id)}
            onLongPress={handleLongPress}
            onClick={() => {
              if (isSelectionMode) {
                if (!stats.closestGoal.id) return;
                const id = stats.closestGoal.id;
                setSelectedGoalIds(prev => {
                  const newIds = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
                  if (newIds.length === 0) setIsSelectionMode(false);
                  return newIds;
                });
              } else {
                if (!stats.closestGoal.id) return;
                resetSelection();
                onNavigate('target_detail', stats.closestGoal.id);
              }
            }}
            isClosest={true}
          />
        </div>
      )}

      {/* Active Goals List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Target className="w-4 h-4 text-primary" /> Target Aktif
          </h3>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onNavigate('goals');
            }}
            className="text-xs text-primary font-medium hover:underline active:opacity-70"
          >
            Lihat Semua
          </button>
        </div>

        <div className="space-y-3">
          {stats.latestGoals.filter(g => g.status === "active").map((goal, i) => {
            return (
              <DashboardGoalCard
                key={goal.id}
                goal={goal}
                i={i}
                isSelected={isSelectionMode && !!goal.id && selectedGoalIds.includes(goal.id)}
                onLongPress={handleLongPress}
                onClick={() => {
                  if (isSelectionMode) {
                    if (!goal.id) return;
                    const id = goal.id;
                    setSelectedGoalIds(prev => {
                      const newIds = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
                      if (newIds.length === 0) setIsSelectionMode(false);
                      return newIds;
                    });
                  } else {
                    resetSelection();
                    onNavigate('target_detail', goal.id);
                  }
                }}
              />
            );
          })}

          {stats.activeCount === 0 && (
            <div className="text-center p-10 border rounded-2xl border-dashed bg-muted/20">
              <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">Belum ada target aktif</p>
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onNavigate('create_target');
        }}
        id="fab-add-goal"
        className="fixed bottom-20 right-4 z-40 bg-primary dark:bg-blue-950 dark:border dark:border-blue-700/50 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-900/20 hover:shadow-xl hover:scale-105 dark:hover:bg-blue-900 transition-all active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>

      </div>
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-6 left-1/2 z-[9999] bg-emerald-600 text-white px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium whitespace-nowrap"
          >
            <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
