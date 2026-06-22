"use client"

import { useEffect, useState } from "react";
import { useGoalStore } from "@/stores/useGoalStore";
import { Currency } from "@/components/ui/Currency";
import { GoalIcon } from "@/components/ui/IconPicker";
import { Plus, Target, CheckCircle2, Edit2, Trash2, X, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLongPress } from "@/hooks/useLongPress";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { DeleteConfirmationModal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/layout/PageHeader";
import type { Goal } from "@/lib/db";
import { cn } from "@/lib/utils";
import type { LongPressEventData } from "@/hooks/useLongPress";
import { getThemeStyle } from "@/lib/theme";

import React from "react";

// ─── GoalCardItem ─────────────────────────────────────────────────────────────

const GoalCardItem = React.memo(function GoalCardItem({ goal, isSelected, onLongPress, onClick }: {
  goal: Goal;
  isSelected?: boolean;
  onLongPress: (goal: Goal, data: LongPressEventData) => void;
  onClick: () => void;
}) {
  const handleLongPress = (data: LongPressEventData) => onLongPress(goal, data);
  const handlers = useLongPress(handleLongPress, onClick, { delay: 400 });

  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const s = getThemeStyle(goal.themeColor ?? "blue");

  return (
    <div {...handlers} className="select-none cursor-pointer relative z-20 pointer-events-auto" onClick={(e) => {
      // Pastikan onClick juga terpanggil jika useLongPress gagal
      if (!handlers.onTouchStart && onClick) onClick();
    }}>
      <div className={cn(
        "rounded-2xl border transition-all duration-200 overflow-hidden relative",
        isSelected
          ? "border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[0.98] shadow-lg z-10"
          : cn(s.cardBg, s.cardBorder, "hover:shadow-md active:scale-[0.99]")
      )}>
        {isSelected && (
          <div className="absolute top-3 right-3 z-20">
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
          </div>
        )}
        <div className="p-4 flex flex-col space-y-4 pointer-events-none">
          {/* Top row: Icon, Info, Percentage */}
          <div className="flex items-center space-x-3">
            {/* Kiri: Icon */}
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner", s.iconBg, s.iconColor)}>
              <GoalIcon name={goal.icon} className="w-6 h-6" />
            </div>

            {/* Tengah: Text */}
            <div className="flex-1 min-w-0">
              <h3 className={cn("font-semibold text-sm truncate", s.textPrimary)}>{goal.name}</h3>
              <p className={cn("text-xs mt-0.5 tabular-nums", s.textSecondary)}>
                <Currency amount={goal.currentAmount} />
                <span className="opacity-60"> / <Currency amount={goal.targetAmount} /></span>
              </p>
            </div>
            
            {/* Kanan: Progress % */}
            <div className="text-right shrink-0">
              <span className={cn("font-bold text-base leading-none", s.textPrimary)}>{progress.toFixed(0)}%</span>
            </div>
          </div>
          
          {/* Bawah: Progress Bar */}
          <div className={cn("w-full rounded-full h-2 overflow-hidden shadow-inner", s.progressTrack)}>
            <div
              className={cn("h-2 rounded-full transition-all duration-500", s.progressFill)}
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

// ─── CompletedGoalCard ────────────────────────────────────────────────────────
// Extracted into its own component so that useLongPress is NOT called inside
// a .map() — which would violate React's "same number of hooks every render" rule
// and cause the "Rendered fewer hooks than expected" error.

const CompletedGoalCard = React.memo(function CompletedGoalCard({ goal, isSelected, onLongPress, onClick }: {
  goal: Goal;
  isSelected: boolean;
  onLongPress: (goal: Goal, data: LongPressEventData) => void;
  onClick: () => void;
}) {
  const handlers = useLongPress(
    (data) => onLongPress(goal, data),
    onClick,
    { delay: 400 }
  );

  const s = getThemeStyle(goal.themeColor ?? "blue");

  return (
    <div
      {...handlers}
      className={cn(
        "select-none cursor-pointer relative rounded-2xl border transition-all duration-200 overflow-hidden",
        isSelected 
          ? "border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[0.98] shadow-sm z-10" 
          : cn(s.cardBg, s.cardBorder, "active:scale-[0.99]")
      )}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 z-20">
          <CheckCircle2 className="w-5 h-5 text-blue-500" />
        </div>
      )}
      <div className="p-4 flex flex-col space-y-4 pointer-events-none">
        <div className="flex items-center space-x-3">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner", s.iconBg, s.iconColor)}>
            <GoalIcon name={goal.icon} className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className={cn("font-medium text-sm flex-1 truncate line-through", s.textSecondary)}>{goal.name}</span>
            <p className={cn("text-xs mt-0.5", s.textSecondary)}><Currency amount={goal.currentAmount} /></p>
          </div>
          <CheckCircle2 className={cn("w-5 h-5 shrink-0", s.iconColor)} />
        </div>
      </div>
    </div>
  );
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GoalsPage({ activeTab, onNavigate }: { activeTab: string; onNavigate: (tab: string, id?: string) => void }) {
  const { goals, loadGoals, isLoading, deleteGoal } = useGoalStore();

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Only load data when this tab is active
    if (activeTab === 'goals') {
      loadGoals();
    }
  }, [activeTab, loadGoals]);

  // ⚠️ All hooks MUST be called before any early return (Rules of Hooks)
  const activeGoals = React.useMemo(() => goals.filter(g => g.status === "active"), [goals]);
  const completedGoals = React.useMemo(() => goals.filter(g => g.status === "completed"), [goals]);
  const { visibleItems: visibleActiveGoals, hasMore, sentinelRef } = useInfiniteScroll(activeGoals, { initialCount: 10, step: 10 });

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
    if (activeTab === 'goals') {
      resetSelection();
    }
  }, [activeTab]);

  const [toastMessage, setToastMessage] = useState("");

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
    
    setToastMessage(`Target berhasil dihapus!`);
    setTimeout(() => setToastMessage(""), 2000);
  };

  if (isLoading && goals.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-background flex flex-col pointer-events-none">
      {/* Delete Confirmation Modal */}
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

      {isSelectionMode ? (
        <div className="flex-none z-20 relative pointer-events-auto bg-white dark:bg-slate-900 border-b border-border shadow-sm">
          <div className="px-4 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}>
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
          </div>
        </div>
      ) : (
        <div className="flex-none z-20 relative pointer-events-auto">
          <PageHeader 
            title="Target Tabungan" 
            subtitle="Kelola semua target keuanganmu." 
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-6 pb-safe space-y-5 pointer-events-auto relative z-10">
      {/* Active Goals */}
      <div className="space-y-3">
        {visibleActiveGoals.map((goal, i) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i % 10) * 0.07 }}
          >
            <GoalCardItem
              goal={goal}
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
          </motion.div>
        ))}
        {hasMore && (
          <div ref={sentinelRef} className="h-10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {activeGoals.length === 0 && (
          <div className="text-center p-12 border-2 rounded-2xl border-dashed bg-muted/20">
            <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="font-semibold text-foreground">Belum Ada Target</h3>
            <p className="text-sm text-muted-foreground mb-4 mt-1">Mulai buat target tabungan pertamamu.</p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNavigate('create_target');
              }}
              className="text-primary font-semibold text-sm hover:underline active:opacity-70"
            >
              Buat Target Baru
            </button>
          </div>
        )}
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-muted-foreground">Target Selesai ({completedGoals.length})</h3>
          </div>
          <div className="space-y-2 opacity-70">
            {/* CompletedGoalCard is a real component — useLongPress is safe here */}
            {completedGoals.map(goal => (
              <CompletedGoalCard
                key={goal.id}
                goal={goal}
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
            ))}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onNavigate('create_target');
        }}
        id="fab-goals-add"
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
