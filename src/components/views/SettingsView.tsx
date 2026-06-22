"use client"

import { useSettingsStore } from "@/stores/useSettingsStore";
import { useGoalStore } from "@/stores/useGoalStore";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { db } from "@/lib/db";
import { useTheme } from "next-themes";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import {
  Moon, Sun, Monitor, Download, Upload, Lock, FileSpreadsheet,
  Eye, EyeOff, Shield, ChevronRight, Info, Trash2, KeyRound, CheckCircle2,
  Wallet
} from "lucide-react";
import { FaInstagram, FaGlobe } from "react-icons/fa";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

import { hashSecurityAnswer } from "@/lib/utils";

function SettingRow({ icon: Icon, label, sublabel, onClick, danger = false, rightNode }: {
  icon: React.ElementType; label: string; sublabel?: string; onClick?: () => void; danger?: boolean; rightNode?: React.ReactNode;
}) {
  return (
    <button type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center space-x-4 p-4 hover:bg-muted/50 active:bg-muted transition-colors text-left",
        !onClick && "cursor-default hover:bg-transparent"
      )}
    >
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
        danger ? "bg-red-100 dark:bg-red-950/40 text-red-500" : "bg-muted text-foreground"
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", danger && "text-red-500")}>{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
      {rightNode ?? (onClick && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />)}
    </button>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">{title}</p>
      <Card>
        <CardContent className="p-0 divide-y divide-border overflow-hidden rounded-xl">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

import { createPortal } from "react-dom";

function AboutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Capacitor back-button support
  useEffect(() => {
    if (!isOpen) return;
    const handleBack = (e: Event) => { e.preventDefault(); onClose(); };
    window.addEventListener('app-back-button', handleBack);
    return () => window.removeEventListener('app-back-button', handleBack);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, mounted]);

  const openLink = async (url: string) => {
    try {
      await Browser.open({ url });
    } catch {
      window.open(url, '_blank');
    }
  };

  if (!mounted) return null;

  const portalTarget = document.getElementById('modal-root') ?? document.body;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="about-backdrop"
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* ── Panel — always centred, never melorot ── */}
          <div
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              key="about-panel"
              className="relative w-full max-w-sm bg-white dark:bg-[#101420] rounded-[2.5rem] p-6 shadow-2xl flex flex-col space-y-5 border border-slate-200 dark:border-slate-800 pointer-events-auto text-slate-900 dark:text-slate-100"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Logo + App name */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-[72px] h-[72px] rounded-[20px] overflow-hidden shadow-lg drop-shadow-lg flex items-center justify-center bg-white border border-slate-100 dark:border-slate-800">
                  <img
                    src="/logo.jpg"
                    alt="Sakuin Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="font-extrabold text-3xl tracking-tight">Sakuin</h2>
                  <p className="text-slate-500 text-xs font-medium mt-1">Versi 1.0.0</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-600 dark:text-slate-400 text-center text-sm leading-relaxed px-2">
                Aplikasi pencatat target tabungan yang membantu pengguna mengelola dan memantau progres tabungan secara offline.
              </p>

              {/* Developer card (Re-designed Personal Text) */}
              <div className="bg-slate-50 dark:bg-[#161d30] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">Pengembang</p>
                <p className="text-slate-800 dark:text-slate-200 text-sm font-semibold leading-relaxed">Pratama</p>
              </div>

              {/* Security card */}
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-2xl p-4 text-left space-y-2 text-blue-800 dark:text-blue-300">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 shrink-0" />
                  <p className="text-xs font-semibold">Keamanan Data</p>
                </div>
                <p className="text-xs leading-relaxed">
                  Semua data disimpan secara lokal di perangkat dan tidak dikirim ke server manapun.
                </p>
              </div>

              {/* Social links */}
              <div className="flex justify-center space-x-4 pt-1">
                <button
                  type="button"
                  onClick={() => openLink('https://www.instagram.com/dreasprb_/')}
                  className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-full p-3.5 hover:bg-slate-200 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 transition-colors active:scale-90"
                  aria-label="Instagram"
                >
                  <FaInstagram size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => openLink('https://dreasprb.my.id')}
                  className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-full p-3.5 hover:bg-slate-200 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 transition-colors active:scale-90"
                  aria-label="Website"
                >
                  <FaGlobe size={18} />
                </button>
              </div>

              {/* Single close CTA */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[#0052b4] to-[#007cdb] hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-md shadow-blue-500/10 dark:from-[#0066cc] dark:to-[#004499] dark:text-white"
              >
                Tutup
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    portalTarget
  );
}

export default function SettingsPage({ activeTab, onNavigate }: { activeTab: string; onNavigate: (tab: string) => void }) {
  const { theme, setTheme } = useTheme();
  const { settings, loadSettings, updateSettings } = useSettingsStore();
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<{ goals: unknown[]; transactions: unknown[] } | null>(null);

  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    // Only load data when this tab is active
    if (activeTab === 'settings') {
      loadSettings();
    }
  }, [activeTab, loadSettings]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── PIN flow ─────────────────────────────────────────────────────────────
  const hasPin = !!settings?.pin;

  // ── Export / Import ───────────────────────────────────────────────────────
  const handleExportJSON = async () => {
    try {
      const goals = await db.goals.toArray();
      const transactions = await db.transactions.toArray();
      const jsonString = JSON.stringify({ goals, transactions, exportDate: new Date().toISOString() }, null, 2);
      const fileName = `sakuin-backup-${new Date().toISOString().split("T")[0]}.json`;

      if (Capacitor.isNativePlatform()) {
        await Filesystem.writeFile({
          path: fileName,
          data: jsonString,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        showToast(`Backup disimpan di Documents/${fileName}`);
      } else {
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Backup JSON berhasil diunduh.");
      }
    } catch { showToast("Gagal backup data."); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (Array.isArray(data.goals) && Array.isArray(data.transactions)) {
          setPendingImportData(data as { goals: unknown[]; transactions: unknown[] });
          setImportConfirmOpen(true);
        } else { showToast("Format file tidak valid."); }
      } catch { showToast("Gagal membaca file."); }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (!pendingImportData) return;
    try {
      await db.transaction("rw", db.goals, db.transactions, async () => {
        await db.goals.clear();
        await db.transactions.clear();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.goals.bulkAdd(pendingImportData.goals as any[]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.transactions.bulkAdd(pendingImportData.transactions as any[]);
      });
      useGoalStore.getState().loadGoals();
      useTransactionStore.getState().loadTransactions();
      showToast("Data berhasil di-restore!");
    } catch { showToast("Gagal meng-import data."); }
    setImportConfirmOpen(false);
    setPendingImportData(null);
  };

  const handleExportCSV = async () => {
    try {
      const transactions = await db.transactions.orderBy("createdAt").reverse().toArray();
      const goals = await db.goals.toArray();
      let csv = "Tanggal,Waktu,Target,Jenis,Nominal,Catatan\n";
      transactions.forEach(tx => {
        const goal = goals.find(g => g.id === tx.goalId);
        const d = new Date(tx.createdAt);
        const note = tx.note ? `"${tx.note.replace(/"/g, '""')}"` : "";
        csv += `${d.toLocaleDateString("id-ID")},${d.toLocaleTimeString("id-ID")},"${goal?.name ?? "Dihapus"}",${tx.type === "in" ? "Masuk" : "Keluar"},${tx.amount},${note}\n`;
      });
      const fileName = `sakuin-laporan-${new Date().toISOString().split("T")[0]}.csv`;

      if (Capacitor.isNativePlatform()) {
        await Filesystem.writeFile({
          path: fileName,
          data: csv,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        showToast(`CSV disimpan di Documents/${fileName}`);
      } else {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Laporan CSV berhasil diunduh.");
      }
    } catch { showToast("Gagal ekspor CSV."); }
  };

  if (!settings) return null;

  return (
    <div className="flex flex-col flex-1 w-full bg-background overflow-hidden">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-4 left-4 right-4 z-[300] flex items-center space-x-2 bg-foreground text-background px-4 py-3 rounded-xl shadow-xl text-sm font-medium"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}

      {/* Import Confirm Modal */}
      <Modal isOpen={importConfirmOpen} onClose={() => setImportConfirmOpen(false)}>
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Restore Data?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Seluruh data saat ini akan digantikan dengan data dari file backup. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="flex w-full space-x-3 pt-1">
            <button type="button" onClick={() => setImportConfirmOpen(false)} className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">Batal</button>
            <button type="button" onClick={confirmImport} className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors">Restore</button>
          </div>
        </div>
      </Modal>

      <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />

      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />

      <div className="flex-none z-20 relative">
        <PageHeader 
          title="Pengaturan" 
          subtitle="Sesuaikan aplikasi dengan kebutuhanmu." 
        />
      </div>

      <div className="flex-1 w-full overflow-y-auto pt-4 px-4 pb-16 space-y-6">
      {/* ── TAMPILAN ── */}
      <SectionCard title="Tampilan">
        {/* Theme selector */}
        <div className="p-4 space-y-3">
          <p className="text-sm font-medium">Mode Tampilan</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: "light", label: "Terang", Icon: Sun },
              { id: "dark", label: "Gelap", Icon: Moon },
              { id: "system", label: "Sistem", Icon: Monitor },
            ] as { id: string; label: string; Icon: React.ElementType }[]).map(({ id, label, Icon }) => (
              <button type="button"
                key={id}
                onClick={() => setTheme(id)}
                className={cn(
                  "flex flex-col items-center py-3 px-2 rounded-xl border-2 transition-all space-y-1.5 text-xs font-medium",
                  theme === id
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* ── KEAMANAN ── */}
      <SectionCard title="Keamanan">
        {!hasPin ? (
          <SettingRow
            icon={Lock}
            label="Aktifkan PIN"
            sublabel="Lindungi aplikasi dengan PIN 6 digit"
            onClick={() => onNavigate('security_create_pin')}
          />
        ) : (
          <>
            <SettingRow
              icon={Shield}
              label="PIN Aktif"
              sublabel="Aplikasi terlindungi"
              rightNode={<span className="text-xs text-blue-500 font-semibold bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">Aktif</span>}
            />
            <SettingRow
              icon={KeyRound}
              label="Ubah PIN"
              sublabel="Ganti PIN yang sedang digunakan"
              onClick={() => onNavigate('security_change_pin')}
            />
            <SettingRow
              icon={Trash2}
              label="Hapus PIN"
              sublabel="Nonaktifkan kunci PIN"
              danger
              onClick={() => onNavigate('security_delete_pin')}
            />
          </>
        )}
      </SectionCard>

      {/* ── DATA & BACKUP ── */}
      <SectionCard title="Data & Backup">
        <SettingRow icon={Download} label="Backup (JSON)" sublabel="Ekspor seluruh data ke file JSON" onClick={handleExportJSON} />
        <SettingRow icon={Upload} label="Restore (JSON)" sublabel="Impor data dari file backup" onClick={() => fileInputRef.current?.click()} />
        <SettingRow icon={FileSpreadsheet} label="Ekspor ke Excel (CSV)" sublabel="Unduh laporan transaksi" onClick={handleExportCSV} />
      </SectionCard>

      {/* ── TENTANG APLIKASI ── */}
      <SectionCard title="Tentang Aplikasi">
        <SettingRow 
          icon={Info} 
          label="Tentang Aplikasi" 
          sublabel="Versi 1.0.0" 
          onClick={() => setAboutOpen(true)}
        />
        </SectionCard>
      </div>
    </div>
  );
}

