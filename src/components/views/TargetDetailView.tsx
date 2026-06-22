"use client"

import { useState, useMemo, useEffect } from "react";
import { useGoalStore } from "@/stores/useGoalStore";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Currency } from "@/components/ui/Currency";
import { GoalIcon } from "@/components/ui/IconPicker";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, History, X, Check, Calendar, MoreVertical, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getThemeStyle, getDetailHeroStyle } from "@/lib/theme";
import { motion, AnimatePresence } from "framer-motion";
import { useLongPress, type LongPressEventData } from "@/hooks/useLongPress";
import { DeleteTxConfirmModal, BottomActionSheet } from "@/components/ui/Modal";

interface TargetDetailViewProps {
  activeTab: string;
  onNavigate: (tab: string, targetId?: string) => void;
  targetId?: string;
}

function DetailTransactionCard({
  tx,
  isSelected,
  onLongPress
}: {
  tx: any;
  isSelected: boolean;
  onLongPress: (tx: any, data: LongPressEventData) => void;
}) {
  const handlers = useLongPress((data) => onLongPress(tx, data), undefined, { delay: 400 });

  return (
    <div {...handlers} className="cursor-pointer select-none transition-all relative">
      <Card className={cn("transition-all duration-200", isSelected ? "border-primary ring-4 ring-primary/10 scale-[0.98] shadow-lg bg-primary/5 z-10" : "shadow-sm border-border/50 hover:border-primary/50")}>
        <CardContent className="p-4 flex items-center space-x-4 pointer-events-none">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", 
            tx.type === "in" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
          )}>
            {tx.type === "in" ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{tx.note || (tx.type === "in" ? "Tambah Dana" : "Tarik Dana")}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(tx.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className={cn("font-bold", tx.type === "in" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
              {tx.type === "in" ? "+" : "-"}<Currency amount={tx.amount} />
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TargetDetailView({ activeTab, onNavigate, targetId }: TargetDetailViewProps) {
  const { goals, getGoalById, loadGoals } = useGoalStore();
  const { transactions, loadTransactions, addTransaction, deleteTransaction } = useTransactionStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"in" | "out">("in");
  const [amountInput, setAmountInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const { deleteGoal } = useGoalStore();

  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [showTxActionSheet, setShowTxActionSheet] = useState(false);
  const [showTxDeleteModal, setShowTxDeleteModal] = useState(false);
  const [isDeletingTx, setIsDeletingTx] = useState(false);

  const handleLongPressTx = (tx: any, data: LongPressEventData) => {
    setSelectedTx(tx);
    setShowTxActionSheet(true);
  };

  const handleDeleteTxRequest = () => {
    setShowTxActionSheet(false);
    setShowTxDeleteModal(true);
  };

  const handleDeleteTx = async () => {
    if (!selectedTx || !selectedTx.id) return;
    setIsDeletingTx(true);
    try {
      await deleteTransaction(selectedTx.id);
      setToastMessage("Transaksi berhasil dihapus");
      setTimeout(() => setToastMessage(""), 2000);
    } catch (error) {
      console.error("Gagal menghapus transaksi:", error);
    } finally {
      setIsDeletingTx(false);
      setShowTxDeleteModal(false);
      setSelectedTx(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'target_detail') {
      loadGoals();
      loadTransactions();
    }
  }, [activeTab, loadGoals, loadTransactions]);

  const goal = useMemo(() => {
    if (!targetId) return null;
    return getGoalById(targetId);
  }, [targetId, goals]); // depend on transactions to trigger re-render on new tx

  const goalTransactions = useMemo(() => {
    if (!targetId) return [];
    return transactions.filter(t => t.goalId === targetId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [transactions, targetId]);

  if (activeTab !== 'target_detail') return null;

  if (!goal) {
    return (
      <div className="flex flex-col h-full w-full bg-background items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Target tidak ditemukan.</p>
        <button onClick={() => onNavigate('home')} className="bg-primary text-white px-4 py-2 rounded-xl">Kembali ke Home</button>
      </div>
    );
  }

  const s = getThemeStyle(goal.themeColor ?? "blue");
  const hs = getDetailHeroStyle(goal.themeColor ?? "blue");
  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  const formatCurrencyInput = (val: string) => {
    const numbers = val.replace(/\D/g, "");
    if (!numbers) return "";
    return new Intl.NumberFormat("id-ID").format(parseInt(numbers, 10));
  };

  const openModal = (type: "in" | "out") => {
    setModalType(type);
    setAmountInput("");
    setNoteInput("");
    setIsModalOpen(true);
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(amountInput.replace(/\D/g, "") || "0", 10);
    if (parsedAmount <= 0) return;

    // ── Anti-minus guard ──────────────────────────────────────────────────────
    if (modalType === "out" && parsedAmount > goal.currentAmount) {
      const maxFormatted = new Intl.NumberFormat("id-ID").format(goal.currentAmount);
      setToastMessage(`error:Gagal! Saldo tidak mencukupi. Maksimal penarikan Rp ${maxFormatted}.`);
      setTimeout(() => setToastMessage(""), 2500);
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction(goal.id!, modalType, parsedAmount, noteInput.trim() || (modalType === "in" ? "Tambah Dana" : "Tarik Dana"));
      setIsModalOpen(false);
      
      const formattedAmount = new Intl.NumberFormat("id-ID").format(parsedAmount);
      setToastMessage(`Rp ${formattedAmount} Berhasil ${modalType === "in" ? "Ditambahkan ke" : "Ditarik dari"} Tabungan!`);
      setTimeout(() => setToastMessage(""), 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!targetId) return;
    try {
      await deleteGoal(targetId);
      setShowDeleteModal(false);
      onNavigate('home');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Fixed Topbar — same gradient as PageHeader/TransactionsView */}
      <div className="fixed top-0 left-0 right-0 z-30">
        <div
          className="relative px-4 pb-6 rounded-b-[2rem] shadow-sm overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #003B73 0%, #00529C 50%, #0095FF 100%)",
            paddingTop: "calc(env(safe-area-inset-top, 24px) + 1rem)",
          }}
        >
          {/* Dark mode overlay */}
          <div className="absolute inset-0 hidden dark:block bg-[linear-gradient(135deg,#0d1a2e_0%,#112240_50%,#080f1e_100%)]" />

          <div className="flex items-center justify-between relative z-10">
            {/* Back button */}
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>

            {/* Title */}
            <h1 className="text-xl font-bold text-white tracking-tight">Detail Target</h1>

            {/* More menu trigger */}
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(true)}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center transition-all"
            >
              <MoreVertical className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Scroll Container */}
      <div
        className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 px-4 pb-32 scrollbar-none relative z-20 space-y-6"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 24px) + 5.5rem)" }}
      >
        {/* Detail Card dengan UI Tipografi Modern */}
        <Card className={cn("rounded-3xl border-0 overflow-hidden", hs.heroBg, hs.heroBorder, hs.heroShadow)}>
          <CardContent className="p-6 relative">
            {/* Dekorasi Card */}
            <div className={cn("absolute -right-8 -top-8 w-40 h-40 rounded-full", hs.heroRing)} />
            <div className={cn("absolute -right-2 -bottom-10 w-32 h-32 rounded-full", hs.heroRing)} />

            <div className="flex items-center space-x-4 mb-8 relative z-10">
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner", hs.heroIconBg, hs.heroIconColor)}>
                <GoalIcon name={goal.icon} className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className={cn("text-xl font-bold truncate", hs.heroTextPrimary)}>{goal.name}</h2>
                <div className={cn("flex items-center text-sm mt-1", hs.heroTextSecondary)}>
                  <span>{progress >= 100 ? "Target Tercapai 🎉" : "Progres Tabungan"}</span>
                </div>
              </div>
            </div>
            
            <div className="relative z-10 text-center mb-8">
              <p className={cn("text-xs font-semibold uppercase tracking-wider mb-2", hs.heroTextSecondary)}>Total Terkumpul</p>
              <p className={cn("text-3xl font-bold tracking-tight shrink-0 break-words", hs.heroTextPrimary)}>
                <Currency amount={goal.currentAmount} />
              </p>
            </div>

            <div className={cn("flex justify-between items-end pt-5 border-t mt-4 relative z-10", hs.heroDivider)}>
              <div>
                <p className={cn("text-xs font-semibold uppercase tracking-wider mb-1", hs.heroTextSecondary)}>Target Akhir</p>
                <p className={cn("font-bold text-lg", hs.heroTextPrimary)}><Currency amount={goal.targetAmount} /></p>
              </div>
              {remaining > 0 && (
                <div className="text-right">
                  <p className={cn("text-xs font-semibold uppercase tracking-wider mb-1", hs.heroTextSecondary)}>Kekurangan</p>
                  <p className="font-semibold text-white/90 text-lg"><Currency amount={remaining} /></p>
                </div>
              )}
            </div>
            
            <div className="pt-5 relative z-10">
              <div className="flex justify-between text-sm font-semibold mb-2">
                <span className={cn("uppercase text-xs tracking-wider", hs.heroTextSecondary)}>Persentase</span>
                <span className={hs.heroTextPrimary}>{progress.toFixed(1)}%</span>
              </div>
              <ProgressBar progress={progress} colorClass={hs.heroProgressFill} className={cn("h-3 rounded-full mb-4", hs.heroProgressTrack)} />
              
              {goal.deadline && (
                <div className="flex items-center justify-center space-x-1.5 mt-2 opacity-80">
                  <Calendar className={cn("w-3.5 h-3.5", hs.heroTextSecondary)} />
                  <p className={cn("text-xs font-medium", hs.heroTextSecondary)}>
                    Tenggat: <span className={hs.heroTextPrimary}>{new Date(goal.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section Ringkasan Target — gradient-accented cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Masuk */}
          <div className="rounded-2xl overflow-hidden shadow-sm border border-emerald-100 dark:border-emerald-900/40">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-400" />
            <div className="bg-white dark:bg-slate-900/60 px-4 py-3 flex flex-col items-center text-center">
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Total Masuk</p>
              <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                <Currency amount={goalTransactions.filter(t => t.type === "in").reduce((sum, t) => sum + t.amount, 0)} />
              </p>
            </div>
          </div>

          {/* Total Penarikan */}
          <div className="rounded-2xl overflow-hidden shadow-sm border border-rose-100 dark:border-rose-900/40">
            <div className="h-1 w-full bg-gradient-to-r from-rose-400 to-pink-400" />
            <div className="bg-white dark:bg-slate-900/60 px-4 py-3 flex flex-col items-center text-center">
              <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">Total Penarikan</p>
              <p className="text-base font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                <Currency amount={goalTransactions.filter(t => t.type === "out").reduce((sum, t) => sum + t.amount, 0)} />
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => openModal("in")}
            className="flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-emerald-950/40 dark:text-emerald-400 dark:border dark:border-emerald-800/60 backdrop-blur-md py-3.5 rounded-2xl font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            <ArrowDownCircle className="w-5 h-5" />
            <span>Tambah Dana</span>
          </button>
          <button
            onClick={() => openModal("out")}
            disabled={goal.currentAmount <= 0}
            className="flex items-center justify-center space-x-2 bg-rose-500 hover:bg-rose-600 text-white dark:bg-rose-950/40 dark:text-rose-400 dark:border dark:border-rose-800/60 backdrop-blur-md py-3.5 rounded-2xl font-bold shadow-md shadow-rose-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <ArrowUpCircle className="w-5 h-5" />
            <span>Tarik Dana</span>
          </button>
        </div>

        {/* Transaction History */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <History className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-bold text-lg text-foreground">Riwayat Transaksi</h3>
          </div>
          
          <div className="space-y-3">
            {goalTransactions.length === 0 ? (
              <div className="text-center p-8 border rounded-2xl border-dashed bg-muted/20">
                <p className="text-sm text-muted-foreground">Belum ada transaksi untuk target ini.</p>
              </div>
            ) : (
              goalTransactions.map((tx) => {
                const isSelected = selectedTx?.id === tx.id && (showTxActionSheet || showTxDeleteModal);
                return (
                  <DetailTransactionCard
                    key={tx.id}
                    tx={tx}
                    isSelected={isSelected}
                    onLongPress={handleLongPressTx}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Delete Target Button */}
        <div className="mt-10">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Trash2 className="w-5 h-5" />
            <span>Hapus Target Ini</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-border"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-foreground">
                    {modalType === "in" ? "Tambah Dana" : "Tarik Dana"}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-muted rounded-full hover:bg-muted/80 text-muted-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleTransactionSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Jumlah (Rp)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-muted-foreground font-medium">Rp</span>
                      </div>
                      <Input
                        required
                        autoFocus
                        placeholder="0"
                        inputMode="numeric"
                        value={amountInput}
                        onChange={(e) => setAmountInput(formatCurrencyInput(e.target.value))}
                        className="pl-11 bg-muted/50 border-border focus:ring-primary font-bold text-xl h-14 rounded-xl"
                      />
                    </div>
                    {/* Withdrawal over-limit error */}
                    {modalType === "out" && (() => {
                      const parsed = parseInt(amountInput.replace(/\D/g, "") || "0", 10);
                      const isOver = parsed > 0 && parsed > goal.currentAmount;
                      return isOver ? (
                        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                          <span>⚠️</span>
                          <span>Nominal melebihi saldo (Maks. Rp {new Intl.NumberFormat("id-ID").format(goal.currentAmount)})</span>
                        </p>
                      ) : goal.currentAmount > 0 ? (
                        <p className="text-xs text-muted-foreground mt-1">Maks. Rp {new Intl.NumberFormat("id-ID").format(goal.currentAmount)}</p>
                      ) : null;
                    })()}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Catatan <span className="text-muted-foreground font-normal">(Opsional)</span></label>
                    <Input
                      placeholder={modalType === "in" ? "Nabung dari gaji..." : "Dipakai untuk darurat..."}
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      className="bg-muted/50 border-border focus:ring-primary h-12 rounded-xl"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !amountInput || (modalType === "out" && parseInt(amountInput.replace(/\D/g, "") || "0", 10) > goal.currentAmount)}
                    className={cn(
                      "w-full flex items-center justify-center space-x-2 text-white h-14 rounded-xl font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
                      modalType === "in" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                    )}
                  >
                    <Check className="w-5 h-5" />
                    <span>{isSubmitting ? "Menyimpan..." : "Simpan Transaksi"}</span>
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* More Menu Bottom Sheet / Modal */}
      <AnimatePresence>
        {isMoreMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setIsMoreMenuOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-t-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 pb-safe"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
              </div>

              <div className="px-4 pb-6">
                <h3 className="text-base font-bold text-foreground text-center mb-4 mt-2">Pengaturan Target</h3>

                {/* Edit */}
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onNavigate('edit_target', targetId);
                  }}
                  className="w-full flex items-center gap-4 px-3 py-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.98] transition-all"
                >
                  <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                    <Edit2 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground text-sm">Edit Target</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Ubah nama, nominal & tema warna</p>
                  </div>
                </button>

                {/* Divider */}
                <div className="mx-3 border-t border-slate-100 dark:border-slate-800 my-1" />

                {/* Delete */}
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setShowDeleteModal(true);
                  }}
                  className="w-full flex items-center gap-4 px-3 py-3.5 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-[0.98] transition-all"
                >
                  <div className="w-11 h-11 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-rose-600 dark:text-rose-400 text-sm">Hapus Target</p>
                    <p className="text-xs text-rose-400 dark:text-rose-500 mt-0.5">Data tidak bisa dikembalikan</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-border p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Hapus Target?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Apakah Anda yakin ingin menghapus target ini? Semua data riwayat tabungan ini akan hilang selamanya.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="py-3 rounded-xl font-bold bg-muted text-foreground hover:bg-muted/80 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="py-3 rounded-xl font-bold bg-rose-500 text-white shadow-md shadow-rose-500/20 hover:bg-rose-600 transition-colors"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key={toastMessage}
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={cn(
              "fixed top-6 left-1/2 z-[999] backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-sm font-medium whitespace-nowrap",
              toastMessage.startsWith("error:")
                ? "bg-rose-700/90"
                : "bg-gray-900/90"
            )}
          >
            {toastMessage.startsWith("error:") ? (
              <span className="text-rose-200 shrink-0">⚠️</span>
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.startsWith("error:") ? toastMessage.slice(6) : toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Transaction Action Sheet */}
      <BottomActionSheet isOpen={showTxActionSheet} onClose={() => setShowTxActionSheet(false)}>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); handleDeleteTxRequest(); }}
          className="w-full flex items-center justify-center gap-2 py-4 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors text-center"
        >
          <Trash2 className="w-5 h-5 text-rose-600" />
          <span className="font-semibold text-rose-600">Hapus Transaksi</span>
        </button>
        <button
          type="button"
          onClick={() => setShowTxActionSheet(false)}
          className="w-full py-4 mt-2 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-foreground hover:opacity-80 transition-opacity"
        >
          Batal
        </button>
      </BottomActionSheet>

      {/* Delete Transaction Confirm Modal */}
      <DeleteTxConfirmModal
        isOpen={showTxDeleteModal}
        onClose={() => setShowTxDeleteModal(false)}
        onConfirm={handleDeleteTx}
        isDeleting={isDeletingTx}
        tx={selectedTx}
      />

    </div>
  );
}
