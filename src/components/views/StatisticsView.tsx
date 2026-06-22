"use client"

import { useEffect, useMemo } from "react";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { useGoalStore } from "@/stores/useGoalStore";
import { formatCurrency, formatCurrencyMasked } from "@/lib/utils";
import { Currency } from "@/components/ui/Currency";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  TrendingUp, TrendingDown, Wallet, Target, CheckCircle2,
  Hash, Trophy, Timer, Zap, Calendar, BarChart2, ArrowUpDown
} from "lucide-react";

function StatCard({ label, value, icon: Icon, colorClass = "text-primary", subValue }: {
  label: string; value: React.ReactNode; icon: React.ElementType; colorClass?: string; subValue?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Icon className={`w-4 h-4 ${colorClass} shrink-0`} />
          <span className="text-xs text-muted-foreground truncate">{label}</span>
        </div>
        <p className="text-base font-bold truncate">{value}</p>
        {subValue && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subValue}</p>}
      </CardContent>
    </Card>
  );
}

function AchievementRow({ icon: Icon, label, value, colorClass }: {
  icon: React.ElementType; label: string; value: string; colorClass: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-sm text-foreground">{label}</p>
      </div>
      <p className="text-sm font-semibold text-right max-w-[45%] truncate">{value}</p>
    </div>
  );
}



export default function StatisticsPage({ activeTab, onNavigate }: { activeTab: string; onNavigate: (tab: string) => void }) {
  const { transactions, loadTransactions } = useTransactionStore();
  const { goals, loadGoals } = useGoalStore();
  const isHidden = useSettingsStore(s => s.settings?.isBalanceHidden);

  const tooltipFormatter = (value: unknown) => {
    const val = typeof value === "number" ? value : typeof value === "string" ? Number(value) : 0;
    return formatCurrencyMasked(val, !!isHidden);
  };

  useEffect(() => {
    // Only load data when this tab is active
    if (activeTab === 'statistics') {
      loadTransactions();
      loadGoals();
    }
  }, [activeTab, loadTransactions, loadGoals]);

  const stats = useMemo(() => {
    let totalIn = 0, totalOut = 0;
    const dayCount: Record<string, number> = {};
    const monthlyData: Record<string, { name: string; in: number; out: number; net: number }> = {};

    transactions.forEach(tx => {
      const date = new Date(tx.createdAt);
      const monthYear = date.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
      const dayName = date.toLocaleDateString("id-ID", { weekday: "long" });

      if (!monthlyData[monthYear]) monthlyData[monthYear] = { name: monthYear, in: 0, out: 0, net: 0 };
      dayCount[dayName] = (dayCount[dayName] ?? 0) + 1;

      if (tx.type === "in") {
        totalIn += tx.amount;
        monthlyData[monthYear].in += tx.amount;
      } else {
        totalOut += tx.amount;
        monthlyData[monthYear].out += tx.amount;
      }
      monthlyData[monthYear].net = monthlyData[monthYear].in - monthlyData[monthYear].out;
    });

    const chartData = Object.values(monthlyData);

    const depositsOnly = transactions.filter(t => t.type === "in");
    const withdrawalsOnly = transactions.filter(t => t.type === "out");
    const avgDeposit = depositsOnly.length > 0 ? totalIn / depositsOnly.length : 0;
    const avgWithdrawal = withdrawalsOnly.length > 0 ? totalOut / withdrawalsOnly.length : 0;

    const activeGoals = goals.filter(g => g.status === "active");
    const completedGoals = goals.filter(g => g.status === "completed");
    const biggestGoal = [...goals].sort((a, b) => b.targetAmount - a.targetAmount)[0];
    const smallestGoal = [...goals].sort((a, b) => a.targetAmount - b.targetAmount)[0];

    const fastestGoal = completedGoals.length > 0
      ? [...completedGoals].sort((a, b) => {
          const tA = new Date(a.updatedAt).getTime() - new Date(a.createdAt).getTime();
          const tB = new Date(b.updatedAt).getTime() - new Date(b.createdAt).getTime();
          return tA - tB;
        })[0]
      : null;

    const longestGoal = completedGoals.length > 0
      ? [...completedGoals].sort((a, b) => {
          const tA = new Date(a.updatedAt).getTime() - new Date(a.createdAt).getTime();
          const tB = new Date(b.updatedAt).getTime() - new Date(b.createdAt).getTime();
          return tB - tA;
        })[0]
      : null;

    const mostActiveDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
    const bestMonth = chartData.slice().sort((a, b) => b.in - a.in)[0]?.name ?? "-";

    const netBalance = totalIn - totalOut;
    const growthPct = totalOut > 0 ? ((netBalance / totalOut) * 100).toFixed(1) : null;

    // Average progress of active goals
    const avgProgress = activeGoals.length > 0
      ? activeGoals.reduce((sum, g) => sum + (g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0), 0) / activeGoals.length
      : 0;

    const totalAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalRemaining = Math.max(0, totalTarget - totalAmount);

    // Active goal closest to 100%
    const closestToComplete = activeGoals.length > 0
      ? [...activeGoals].sort((a, b) => {
          const pA = a.targetAmount > 0 ? a.currentAmount / a.targetAmount : 0;
          const pB = b.targetAmount > 0 ? b.currentAmount / b.targetAmount : 0;
          return pB - pA;
        })[0]
      : null;

    return {
      totalIn, totalOut, avgDeposit, avgWithdrawal,
      txCount: transactions.length,
      depositCount: depositsOnly.length,
      withdrawCount: withdrawalsOnly.length,
      activeCount: activeGoals.length,
      completedCount: completedGoals.length,
      totalGoals: goals.length,
      biggestGoal, smallestGoal, fastestGoal, longestGoal,
      mostActiveDay, bestMonth, chartData, netBalance, growthPct, avgProgress, closestToComplete,
      totalAmount, totalTarget, totalRemaining
    };
  }, [transactions, goals]);

  return (
    <div className="flex flex-col flex-1 w-full bg-background overflow-hidden">
      <div className="flex-none z-20 relative">
        <PageHeader 
          title="Statistik" 
          subtitle="Analisis mendalam keuangan tabunganmu." 
        />
      </div>

      <div className="flex-1 w-full overflow-y-auto pt-4 px-4 pb-16 space-y-6">
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ringkasan Target</h3>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="Total Target Aktif" value={String(stats.activeCount)} icon={Target} colorClass="text-blue-500" />
          <StatCard label="Target Selesai" value={String(stats.completedCount)} icon={CheckCircle2} colorClass="text-indigo-500" />
          <StatCard label="Tabungan Terkumpul" value={<Currency amount={stats.totalAmount} />} icon={TrendingUp} colorClass="text-blue-500" />
          <StatCard label="Sisa Menuju Target" value={<Currency amount={stats.totalRemaining} />} icon={TrendingDown} colorClass="text-amber-500" />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ringkasan Keuangan</h3>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="Total Pemasukan" value={<Currency amount={stats.totalIn} />} icon={TrendingUp} colorClass="text-emerald-500" subValue={`${stats.depositCount} transaksi`} />
          <StatCard label="Total Pengeluaran" value={<Currency amount={stats.totalOut} />} icon={TrendingDown} colorClass="text-rose-500" subValue={`${stats.withdrawCount} transaksi`} />
          <StatCard label="Rata-rata Setoran" value={<Currency amount={stats.avgDeposit} />} icon={TrendingUp} colorClass="text-emerald-500" />
          <StatCard label="Pertumbuhan" value={stats.growthPct !== null ? `${stats.growthPct}%` : "-"} icon={BarChart2} colorClass="text-amber-500" />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Arus Kas Bulanan</h3>
        <Card>
          <CardContent className="p-4 h-56">
            {stats.chartData.length > 0 ? (
              activeTab === 'statistics' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData} barGap={3}>
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip formatter={tooltipFormatter} cursor={{ fill: "transparent" }} />
                    <Bar dataKey="in" name="Masuk" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="out" name="Keluar" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : null
            ) : (
              <div className="h-full flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                <BarChart2 className="w-8 h-8 opacity-30" />
                <p className="text-sm">Belum ada data transaksi</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {stats.activeCount > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Progress Target Aktif</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <ArrowUpDown className="w-4 h-4 text-violet-500 shrink-0" />
                  <span className="text-xs text-muted-foreground">Rata-rata Progress</span>
                </div>
                <p className="text-base font-bold">{stats.avgProgress.toFixed(1)}%</p>
                <div className="mt-2">
                  <ProgressBar progress={stats.avgProgress} colorClass="bg-violet-500" className="h-1.5" />
                </div>
              </CardContent>
            </Card>
            {stats.closestToComplete && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-xs text-muted-foreground">Paling Dekat Selesai</span>
                  </div>
                  <p className="text-sm font-bold truncate">{stats.closestToComplete.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stats.closestToComplete.targetAmount > 0
                      ? ((stats.closestToComplete.currentAmount / stats.closestToComplete.targetAmount) * 100).toFixed(0)
                      : 0}%
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pencapaian &amp; Rekap</h3>
        <Card>
          <CardContent className="p-4 space-y-3">
            <AchievementRow icon={Trophy} label="Target Terbesar" value={stats.biggestGoal?.name ?? "-"} colorClass="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
            <AchievementRow icon={Target} label="Target Terkecil" value={stats.smallestGoal?.name ?? "-"} colorClass="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" />
            <AchievementRow icon={Zap} label="Tercepat Selesai" value={stats.fastestGoal?.name ?? "-"} colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
            <AchievementRow icon={Timer} label="Terlama Selesai" value={stats.longestGoal?.name ?? "-"} colorClass="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" />
            <AchievementRow icon={Calendar} label="Hari Paling Aktif" value={stats.mostActiveDay} colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
            <AchievementRow icon={CheckCircle2} label="Bulan Terbaik" value={stats.bestMonth} colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
 
