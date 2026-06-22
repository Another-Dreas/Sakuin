"use client"

import { useState, useEffect } from "react";
import { useGoalStore } from "@/stores/useGoalStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { IconPicker, DEFAULT_ICON } from "@/components/ui/IconPicker";
import { ArrowLeft, Save, CheckCircle2, Tag, Wallet, Check, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEME_COLORS } from "@/lib/theme";
import { motion, AnimatePresence } from "framer-motion";

interface CreateTargetViewProps {
  activeTab: string;
  onNavigate: (tab: string, targetId?: string) => void;
  targetId?: string;
}

export default function CreateTargetView({ activeTab, onNavigate, targetId }: CreateTargetViewProps) {
  const { addGoal, updateGoal, getGoalById } = useGoalStore();
  const isEditMode = activeTab === 'edit_target' && !!targetId;

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [icon, setIcon] = useState(DEFAULT_ICON);
  const [themeColor, setThemeColor] = useState("blue");
  const [deadline, setDeadline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (activeTab === 'create_target') {
      setName("");
      setTargetAmount("");
      setIcon(DEFAULT_ICON);
      setThemeColor("blue");
      setDeadline("");
    } else if (isEditMode && targetId) {
      const goal = getGoalById(targetId);
      if (goal) {
        setName(goal.name);
        setTargetAmount(new Intl.NumberFormat("id-ID").format(goal.targetAmount));
        setIcon(goal.icon || DEFAULT_ICON);
        setThemeColor(goal.themeColor || "blue");
        setDeadline(goal.deadline || "");
      }
    }
  }, [activeTab, targetId, getGoalById, isEditMode]);

  // Parse raw currency string to integer
  const parsedTargetAmount = parseInt(targetAmount.replace(/\D/g, "") || "0", 10);

  const formatCurrencyInput = (val: string) => {
    const numbers = val.replace(/\D/g, "");
    if (!numbers) return "";
    return new Intl.NumberFormat("id-ID").format(parseInt(numbers, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || parsedTargetAmount <= 0) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && targetId) {
        await updateGoal(targetId, {
          name: name.trim(),
          targetAmount: parsedTargetAmount,
          icon,
          themeColor,
          deadline: deadline || undefined,
        });
        setToastMessage("Target berhasil diperbarui!");
      } else {
        await addGoal({
          name: name.trim(),
          targetAmount: parsedTargetAmount,
          icon,
          themeColor,
          deadline: deadline || undefined,
        });
        setToastMessage("Target berhasil dibuat!");
      }
      
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onNavigate(isEditMode ? 'target_detail' : 'home', isEditMode ? targetId : undefined);
      }, 1500);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (activeTab !== 'create_target' && activeTab !== 'edit_target') return null;

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-y-auto">
      <div className="sticky top-0 z-20">
        <PageHeader 
          title={isEditMode ? "Edit Target" : "Buat Target Baru"}
          subtitle={isEditMode ? "Perbarui tujuan finansialmu" : "Tentukan tujuan finansialmu"}
          action={
            <button
              type="button"
              onClick={() => onNavigate(isEditMode ? 'target_detail' : 'home', isEditMode ? targetId : undefined)}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          }
        />
      </div>

      <div className="px-4 pb-12 -mt-4 relative z-10">
        <Card className="bg-white dark:bg-card rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border-0">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Nama Target</label>
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4 flex items-center gap-3 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                  <Tag className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    required
                    placeholder="Contoh: Dana Darurat, Liburan..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-none bg-transparent focus:outline-none focus:ring-0 w-full text-slate-800 dark:text-slate-100 placeholder-slate-400 font-medium p-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Target Dana (Rp)</label>
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4 flex items-center gap-3 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                  <Wallet className="w-5 h-5 text-slate-400 shrink-0" />
                  <span className="text-slate-400 font-semibold">Rp</span>
                  <input
                    required
                    placeholder="0"
                    inputMode="numeric"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(formatCurrencyInput(e.target.value))}
                    className="border-none bg-transparent focus:outline-none focus:ring-0 w-full text-slate-800 dark:text-slate-100 placeholder-slate-400 font-semibold text-lg p-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Ikon Target</label>
                <IconPicker value={icon} onChange={setIcon} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Warna Tema</label>
                <div className="grid grid-cols-6 gap-3">
                  {Object.entries(THEME_COLORS).map(([colorKey, colorVal]) => (
                    <button
                      key={colorKey}
                      type="button"
                      onClick={() => setThemeColor(colorKey)}
                      className={cn(
                        "w-full aspect-square rounded-full transition-all flex items-center justify-center",
                        themeColor === colorKey ? "ring-4 ring-blue-500/30 scale-110 shadow-md" : "hover:scale-105"
                      )}
                      style={{ backgroundColor: colorVal.bg, border: `1px solid ${colorVal.border}` }}
                      title={colorVal.label}
                    >
                      {themeColor === colorKey && <Check className="w-5 h-5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Tenggat Waktu <span className="text-muted-foreground font-normal">(Opsional)</span></label>
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4 flex items-center gap-3 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                  <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="border-none bg-transparent focus:outline-none focus:ring-0 w-full text-slate-800 dark:text-slate-100 placeholder-slate-400 font-medium p-0"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim() || parsedTargetAmount <= 0}
                  className="w-full flex items-center justify-center space-x-2 bg-primary text-white h-14 rounded-xl font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Save className="w-5 h-5" />
                  <span>{isSubmitting ? "Menyimpan..." : (isEditMode ? "Simpan Perubahan" : "Simpan Target")}</span>
                </button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-6 left-1/2 z-[999] bg-gray-900/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-sm font-medium"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
