"use client"

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGoalStore } from "@/stores/useGoalStore";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { Currency } from "@/components/ui/Currency";
import { Card, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { GoalIcon } from "@/components/ui/IconPicker";
import { DeleteConfirmationModal, DeleteTxConfirmModal, BottomActionSheet } from "@/components/ui/Modal";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useLongPress } from "@/hooks/useLongPress";
import type { LongPressEventData } from "@/hooks/useLongPress";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, ArrowDownCircle, ArrowUpCircle, Trash2,
  Calendar, TrendingUp, TrendingDown, Hash, DivideCircle, Clock
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Transaction } from "@/lib/db";
import { getThemeStyle, getDetailHeroStyle } from "@/lib/theme";

function TransactionRow({ tx, isSelected, onLongPress }: { tx: Transaction, isSelected?: boolean, onLongPress: (tx: Transaction, data: LongPressEventData) => void }) {
  const date = new Date(tx.createdAt);
  const dateStr = date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  
  const handlers = useLongPress((data) => onLongPress(tx, data), undefined, { delay: 400 });

  return (
    <div {...handlers} className={cn("flex items-center space-x-3 py-3 border-b border-border last:border-0 cursor-pointer select-none transition-all rounded-lg px-2 -mx-2 relative", isSelected ? "bg-muted scale-[0.98] ring-2 ring-border shadow-sm z-10" : "active:bg-muted/50")}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 pointer-events-none ${tx.type === "in" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"}`}>
        {tx.type === "in" ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0 pointer-events-none">
        <p className="text-sm font-medium truncate">{tx.note || (tx.type === "in" ? "Tambah Dana" : "Tarik Dana")}</p>
        <p className="text-xs text-muted-foreground">{dateStr} · {timeStr}</p>
      </div>
      <div className="text-right shrink min-w-[30%] max-w-[50%] min-w-0 pointer-events-none">
        <p className={`font-semibold text-sm truncate w-full ${tx.type === "in" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
          {tx.type === "in" ? "+" : "-"}<Currency amount={tx.amount} />
        </p>
      </div>
    </div>
  );
}

function GoalDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const { deleteGoal, loadGoals } = useGoalStore();
  const { loadTransactions, deleteTransaction } = useTransactionStore();
  const goals = useGoalStore(state => state.goals);
  const allTransactions = useTransactionStore(state => state.transactions);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingGoal, setIsDeletingGoal] = useState(false);

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showTxActionSheet, setShowTxActionSheet] = useState(false);
  const [showTxDeleteModal, setShowTxDeleteModal] = useState(false);
  const [isDeletingTx, setIsDeletingTx] = useState(false);

  const goal = id ? goals.find(g => g.id === id) : undefined;

  // Transactions for this goal only, newest first
  const goalTransactions = useMemo(() =>
    allTransactions
      .filter(t => t.goalId === id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [allTransactions, id]
  );

  const { visibleItems: visibleTx, hasMore, sentinelRef } = useInfiniteScroll(goalTransactions);

  // Target stats
  const targetStats = useMemo(() => {
    const deposits = goalTransactions.filter(t => t.type === "in");
    const withdrawals = goalTransactions.filter(t => t.type === "out");
    const totalIn = deposits.reduce((s, t) => s + t.amount, 0);
    const totalOut = withdrawals.reduce((s, t) => s + t.amount, 0);
    const avgDeposit = deposits.length > 0 ? totalIn / deposits.length : 0;
    const lastTx = goalTransactions[0];
    return { totalIn, totalOut, count: goalTransactions.length, avgDeposit, lastTx };
  }, [goalTransactions]);

  useEffect(() => {
    if (goals.length === 0) loadGoals();
    if (allTransactions.length === 0) loadTransactions();
  }, [goals.length, allTransactions.length, loadGoals, loadTransactions]);

  const handleDeleteGoal = async () => {
    if (!id) return;
    try {
      setIsDeletingGoal(true);
      await deleteGoal(id);
      router.push("/goals");
    } catch (error) {
      console.error("Gagal menghapus target:", error);
    } finally {
      setIsDeletingGoal(false);
      setShowDeleteModal(false);
    }
  };

  const handleLongPressTx = (tx: Transaction, data: LongPressEventData) => {
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
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeletingTx(false);
      setShowTxDeleteModal(false);
      setSelectedTx(null);
    }
  };

  if (!id || !goal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <p className="text-muted-foreground mb-4">Target tidak ditemukan</p>
        <Button onClick={() => router.push("/goals")} variant="outline">Kembali ke Target</Button>
      </div>
    );
  }

  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const s = getThemeStyle(goal.themeColor ?? "blue");
  const h = getDetailHeroStyle(goal.themeColor ?? "blue");

  return (
    <>
      <BottomActionSheet isOpen={showTxActionSheet} onClose={() => setShowTxActionSheet(false)}>
        <button
          onClick={handleDeleteTxRequest}
          className="w-full flex items-center justify-center gap-2 py-4 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors text-center"
        >
          <Trash2 className="w-5 h-5 text-rose-600" />
          <span className="font-semibold text-rose-600">Hapus Transaksi</span>
        </button>
        <button
          onClick={() => setShowTxActionSheet(false)}
          className="w-full py-4 mt-2 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-foreground hover:opacity-80 transition-opacity"
        >
          Batal
        </button>
      </BottomActionSheet>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTx(null);
        }}
        onConfirm={handleDeleteGoal}
        isDeleting={isDeletingGoal}
      />

      <DeleteTxConfirmModal
        isOpen={showTxDeleteModal}
        onClose={() => {
          setShowTxDeleteModal(false);
          setSelectedTx(null);
        }}
        onConfirm={handleDeleteTx}
        isDeleting={isDeletingTx}
        tx={selectedTx}
      />

      <div className="flex flex-col min-h-full pb-4">
        {/* Header */}
        <div className="flex items-center space-x-3 p-4 pt-8">
          <Link href="/goals" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold">Detail Target</h1>
        </div>

        {/* Hero Card */}
        <motion.div className="px-4 mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className={cn(
            "rounded-3xl p-6 relative overflow-hidden",
            h.heroBg, h.heroBorder, h.heroShadow
          )}>
            {/* Decorative background rings */}
            <div className={cn("absolute -top-10 -right-10 w-44 h-44 rounded-full pointer-events-none", h.heroRing)} />
            <div className={cn("absolute -bottom-12 -right-4 w-36 h-36 rounded-full pointer-events-none", h.heroRing)} />

            {/* Top: Icon & Name */}
            <div className="flex items-center space-x-4 mb-6 relative z-10">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", h.heroIconBg, h.heroIconColor)}>
                <GoalIcon name={goal.icon} className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className={cn("text-lg font-bold truncate", h.heroTextPrimary)}>{goal.name}</h2>
                {goal.description && <p className={cn("text-xs truncate mt-0.5", h.heroTextSecondary)}>{goal.description}</p>}
              </div>
            </div>

            {/* Middle: Amount */}
            <div className="mb-6 relative z-10">
              <p className={cn("text-xs font-semibold uppercase tracking-wider mb-1.5", h.heroTextSecondary)}>Dana Terkumpul</p>
              <p className={cn("text-4xl font-extrabold tracking-tight", h.heroTextPrimary)}><Currency amount={goal.currentAmount} /></p>
            </div>

            {/* Progress */}
            <div className="mb-6 space-y-2.5 relative z-10">
              <div className="flex justify-between items-end">
                <span className={cn("text-xs font-semibold uppercase tracking-wider", h.heroTextSecondary)}>Progress</span>
                <span className={cn("text-base font-bold", h.heroTextPrimary)}>{progress.toFixed(1)}%</span>
              </div>
              <div className={cn("w-full rounded-full h-3 overflow-hidden", h.heroProgressTrack)}>
                <div
                  className={cn("h-3 rounded-full transition-all duration-700", h.heroProgressFill)}
                  style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                />
              </div>
            </div>

            {/* Bottom: Split Stats */}
            <div className={cn("grid grid-cols-2 gap-4 pt-5 border-t relative z-10", h.heroDivider)}>
              <div>
                <p className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1", h.heroTextSecondary)}>Target Dana</p>
                <p className={cn("text-sm font-bold", h.heroTextPrimary)}><Currency amount={goal.targetAmount} /></p>
              </div>
              <div>
                <p className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1", h.heroTextSecondary)}>Sisa Dana</p>
                <p className={cn("text-sm font-bold", h.heroTextPrimary)}><Currency amount={remaining} /></p>
              </div>
            </div>

            {/* Optional Deadline */}
            {goal.deadline && (
              <div className={cn("flex items-center justify-center space-x-2 pt-5 mt-5 border-t border-dashed relative z-10", h.heroDivider)}>
                <Calendar className={cn("w-4 h-4", h.heroTextSecondary)} />
                <p className={cn("text-xs font-medium", h.heroTextSecondary)}>
                  Deadline: <span className={h.heroTextPrimary}>{new Date(goal.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="px-4 mb-5">
          <div className="grid grid-cols-2 gap-3">
            {/* Tambah Dana */}
            <Link href={`/goals/add-funds?id=${id}`} className="block">
              <Card className="hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer">
                <CardContent
                  className="flex flex-col items-center justify-center text-center p-0"
                  style={{ height: "96px" }}
                >
                  <div
                    className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center rounded-xl shrink-0"
                    style={{ width: "40px", height: "40px" }}
                  >
                    <ArrowDownCircle className="w-5 h-5" />
                  </div>
                  <div style={{ height: "12px" }} className="shrink-0" />
                  <div className="flex items-center justify-center w-full px-2" style={{ height: "16px" }}>
                    <span
                      className="font-semibold text-center block w-full overflow-hidden whitespace-nowrap text-ellipsis"
                      style={{ fontSize: "14px", lineHeight: "1" }}
                    >
                      Tambah Dana
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Tarik Dana */}
            <Link href={`/goals/withdraw?id=${id}`} className="block">
              <Card className="hover:border-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer">
                <CardContent
                  className="flex flex-col items-center justify-center text-center p-0"
                  style={{ height: "96px" }}
                >
                  <div
                    className="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center rounded-xl shrink-0"
                    style={{ width: "40px", height: "40px" }}
                  >
                    <ArrowUpCircle className="w-5 h-5" />
                  </div>
                  <div style={{ height: "12px" }} className="shrink-0" />
                  <div className="flex items-center justify-center w-full px-2" style={{ height: "16px" }}>
                    <span
                      className="font-semibold text-center block w-full overflow-hidden whitespace-nowrap text-ellipsis"
                      style={{ fontSize: "14px", lineHeight: "1" }}
                    >
                      Tarik Dana
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Target Stats */}
        <div className="px-4 mb-5">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Ringkasan Target</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-muted-foreground font-medium">Total Masuk</span>
                </div>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400"><Currency amount={targetStats.totalIn} /></p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                  <span className="text-xs text-muted-foreground">Total Penarikan</span>
                </div>
                <p className="text-base font-bold text-rose-600 dark:text-rose-400"><Currency amount={targetStats.totalOut} /></p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <Hash className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs text-muted-foreground">Jumlah Transaksi</span>
                </div>
                <p className="text-base font-bold">{targetStats.count}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <DivideCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Rata-rata Setoran</span>
                </div>
                <p className="text-base font-bold"><Currency amount={targetStats.avgDeposit} /></p>
              </CardContent>
            </Card>
          </div>
          {targetStats.lastTx && (
            <Card className="mt-3">
              <CardContent className="p-4 flex items-center space-x-3">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Transaksi Terakhir</p>
                  <p className="text-sm font-medium truncate">
                    {new Date(targetStats.lastTx.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    {" · "}
                    <span className={targetStats.lastTx.type === "in" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                      {targetStats.lastTx.type === "in" ? "+" : "-"}<Currency amount={targetStats.lastTx.amount} />
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Transaction History */}
        <div className="px-4 mb-5">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Riwayat Transaksi</h3>
          {goalTransactions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                Belum ada transaksi pada target ini.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 divide-y divide-border">
                {visibleTx.map(tx => (
                  <TransactionRow key={tx.id} tx={tx} isSelected={selectedTx?.id === tx.id && (showTxActionSheet || showTxDeleteModal)} onLongPress={handleLongPressTx} />
                ))}
                <div ref={sentinelRef} />
                {hasMore && (
                  <div className="pt-3 text-center text-xs text-muted-foreground">Memuat lebih banyak...</div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Danger Zone */}
        <div className="px-4">
          <Button
            variant="outline"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Hapus Target
          </Button>
        </div>
      </div>
    </>
  );
}

export default function GoalDetailPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <GoalDetailContent />
    </Suspense>
  );
}
