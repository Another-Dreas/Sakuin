"use client"

import { useEffect, useState, useMemo } from "react";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { useGoalStore } from "@/stores/useGoalStore";
import { formatCurrency } from "@/lib/utils";
import { Currency } from "@/components/ui/Currency";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useLongPress } from "@/hooks/useLongPress";
import { DeleteTxConfirmModal, BottomActionSheet } from "@/components/ui/Modal";
import { Clock, TrendingUp, Search, Filter, CalendarDays, FilterX, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LongPressEventData } from "@/hooks/useLongPress";

function TransactionCardItem({
  tx,
  i,
  goalName,
  isSelected,
  onLongPress
}: {
  tx: any;
  i: number;
  goalName: string;
  isSelected: boolean;
  onLongPress: (tx: any, data: LongPressEventData) => void;
}) {
  const date = new Date(tx.createdAt);
  const isToday = date.toDateString() === new Date().toDateString();
  const dateStr = isToday ? "Hari Ini" : date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  const timeStr = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  const handlers = useLongPress((data) => onLongPress(tx, data), undefined, { delay: 400 });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
      <div {...handlers} className="cursor-pointer select-none transition-all relative">
        <Card className={cn("transition-all duration-200", isSelected ? "border-primary ring-4 ring-primary/10 scale-[0.98] shadow-lg bg-primary/5 z-10" : "hover:border-primary/50")}>
          <CardContent className="p-4 flex items-center space-x-3 pointer-events-none">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === "in" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"}`}>
              {tx.type === "in" ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{tx.note || (tx.type === "in" ? "Tambah Dana" : "Tarik Dana")}</h4>
              <p className="text-xs text-muted-foreground truncate">{goalName}</p>
            </div>
            <div className="text-right shrink min-w-[30%] max-w-[50%] min-w-0">
              <p className={`font-semibold text-sm truncate w-full ${tx.type === "in" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {tx.type === "in" ? "+" : "-"}<Currency amount={tx.amount} />
              </p>
              <p className="text-xs text-muted-foreground">{dateStr}, {timeStr}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

type FilterType = "all" | "in" | "out";
type TimeFilterType = "all" | "today" | "week" | "month" | "year";

export default function TransactionsPage({ activeTab, onNavigate }: { activeTab: string; onNavigate: (tab: string) => void }) {
  const { transactions, loadTransactions, isLoading } = useTransactionStore();
  const { goals, loadGoals } = useGoalStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>("all");
  const [goalFilter, setGoalFilter] = useState<string>("all");
  const [showGoalFilter, setShowGoalFilter] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { deleteTransaction } = useTransactionStore();
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [showTxDeleteModal, setShowTxDeleteModal] = useState(false);
  const [isDeletingTx, setIsDeletingTx] = useState(false);

  const [showActionSheet, setShowActionSheet] = useState(false);

  const handleLongPressTx = (tx: any, data: LongPressEventData) => {
    setSelectedTx(tx);
    setShowActionSheet(true);
  };

  const handleDeleteRequest = () => {
    setShowActionSheet(false);
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

  useEffect(() => {
    // Only load data when this tab is active
    if (activeTab === 'transactions') {
      loadTransactions();
      loadGoals();
    }
  }, [activeTab, loadTransactions, loadGoals]);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      // Search
      const goal = goals.find(g => g.id === t.goalId);
      const searchLower = searchTerm.toLowerCase();
      const searchMatch = !searchTerm ||
        (t.note?.toLowerCase().includes(searchLower)) ||
        (goal?.name.toLowerCase().includes(searchLower));
      if (!searchMatch) return false;

      // Type filter
      if (typeFilter !== "all" && t.type !== typeFilter) return false;

      // Goal filter
      if (goalFilter !== "all" && t.goalId !== goalFilter) return false;

      // Time filter
      const txDate = new Date(t.createdAt);
      if (timeFilter === "today") {
        if (txDate.toDateString() !== now.toDateString()) return false;
      } else if (timeFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (txDate < weekAgo) return false;
      } else if (timeFilter === "month") {
        if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) return false;
      } else if (timeFilter === "year") {
        if (txDate.getFullYear() !== now.getFullYear()) return false;
      }
      return true;
    });
  }, [transactions, goals, searchTerm, typeFilter, timeFilter, goalFilter]);

  const { visibleItems, hasMore, sentinelRef } = useInfiniteScroll(filteredTransactions);

  const chipBase = "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors";
  const chipActive = "bg-primary text-primary-foreground";
  const chipInactive = "bg-secondary text-secondary-foreground hover:bg-muted";
  const chipIn = "bg-emerald-500 text-white";
  const chipOut = "bg-rose-500 text-white";

  if (isLoading && transactions.length === 0) {
    return <div className="flex items-center justify-center min-h-[80vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden relative">
      <BottomActionSheet isOpen={showActionSheet} onClose={() => setShowActionSheet(false)}>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); handleDeleteRequest(); }}
          className="w-full flex items-center justify-center gap-2 py-4 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors text-center"
        >
          <Trash2 className="w-5 h-5 text-rose-600" />
          <span className="font-semibold text-rose-600">Hapus Transaksi</span>
        </button>
        <button
          type="button"
          onClick={() => setShowActionSheet(false)}
          className="w-full py-4 mt-2 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-foreground hover:opacity-80 transition-opacity"
        >
          Batal
        </button>
      </BottomActionSheet>

      <DeleteTxConfirmModal
        isOpen={showTxDeleteModal}
        onClose={() => setShowTxDeleteModal(false)}
        onConfirm={handleDeleteTx}
        isDeleting={isDeletingTx}
        tx={selectedTx}
      />

      {/* Fixed Header & Filters */}
      <div className={cn("flex-none z-20 bg-background pb-3 transition-shadow duration-200", isScrolled ? "shadow-md border-b border-border/50" : "")}>
        <PageHeader 
          title="Riwayat Transaksi" 
          subtitle={`${filteredTransactions.length} transaksi ditemukan`}
          className="mb-0"
        />

        <div className="px-4 space-y-4 pt-2 pb-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari transaksi atau target..."
            className="pl-9 bg-card"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Type Filter row */}
        <div className="flex space-x-2 overflow-x-auto pb-1">
          <button type="button" onClick={(e) => { e.preventDefault(); setTypeFilter("all"); }} className={cn(chipBase, typeFilter === "all" ? chipActive : chipInactive)}>Semua</button>
          <button type="button" onClick={(e) => { e.preventDefault(); setTypeFilter("in"); }} className={cn(chipBase, typeFilter === "in" ? chipIn : chipInactive)}>Masuk</button>
          <button type="button" onClick={(e) => { e.preventDefault(); setTypeFilter("out"); }} className={cn(chipBase, typeFilter === "out" ? chipOut : chipInactive)}>Keluar</button>
          <div className="w-px h-6 bg-border mx-1 self-center shrink-0" />
          <button type="button" onClick={(e) => { e.preventDefault(); setTimeFilter(timeFilter === "today" ? "all" : "today"); }} className={cn(chipBase, timeFilter === "today" ? chipActive : chipInactive)}>Hari Ini</button>
          <button type="button" onClick={(e) => { e.preventDefault(); setTimeFilter(timeFilter === "week" ? "all" : "week"); }} className={cn(chipBase, timeFilter === "week" ? chipActive : chipInactive)}>Minggu Ini</button>
          <button type="button" onClick={(e) => { e.preventDefault(); setTimeFilter(timeFilter === "month" ? "all" : "month"); }} className={cn(chipBase, timeFilter === "month" ? chipActive : chipInactive)}>Bulan Ini</button>
          <button type="button" onClick={(e) => { e.preventDefault(); setTimeFilter(timeFilter === "year" ? "all" : "year"); }} className={cn(chipBase, timeFilter === "year" ? chipActive : chipInactive)}>Tahun Ini</button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); setShowGoalFilter(!showGoalFilter); }}
            className={cn(chipBase, "flex items-center gap-1.5", goalFilter !== "all" ? chipActive : chipInactive)}
          >
            <SlidersHorizontal className="w-3 h-3" /> Target
          </button>
        </div>

        {/* Goal filter dropdown */}
        {showGoalFilter && goals.length > 0 && (
          <div className="bg-card border rounded-xl p-3 space-y-1 shadow-md">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setGoalFilter("all"); setShowGoalFilter(false); }}
              className={cn("w-full text-left text-sm px-3 py-2 rounded-lg transition-colors", goalFilter === "all" ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted")}
            >
              Semua Target
            </button>
            {goals.map(g => (
              <button
                type="button"
                key={g.id}
                onClick={(e) => { e.preventDefault(); setGoalFilter(g.id ?? "all"); setShowGoalFilter(false); }}
                className={cn("w-full text-left text-sm px-3 py-2 rounded-lg transition-colors truncate", goalFilter === g.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted")}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}
        </div>
      </div> {/* end sticky */}

      {/* Scrollable list */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-safe"
        onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 10)}
      >
        {visibleItems.length === 0 ? (
          <div className="text-center p-10 text-muted-foreground text-sm border-2 rounded-2xl border-dashed">
            Tidak ada transaksi ditemukan.
          </div>
        ) : (
          visibleItems.map((tx, i) => {
            const goal = goals.find(g => g.id === tx.goalId);
            const date = new Date(tx.createdAt);
            const isToday = date.toDateString() === new Date().toDateString();
            const dateStr = isToday ? "Hari Ini" : date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
            const timeStr = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

            const isSelected = selectedTx?.id === tx.id && (showActionSheet || showTxDeleteModal);

            return (
              <TransactionCardItem
                key={tx.id}
                tx={tx}
                i={i}
                goalName={goal?.name ?? "Target Dihapus"}
                isSelected={isSelected}
                onLongPress={handleLongPressTx}
              />
            );
          })
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} />
        {hasMore && (
          <p className="text-center text-xs text-muted-foreground py-2">Memuat lebih banyak...</p>
        )}
      </div>
      </div>
  );
}
