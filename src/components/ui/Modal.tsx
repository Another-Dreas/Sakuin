"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, children, className }: ModalProps) {
  // Portal mount guard — prevents SSR mismatch
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Back-button handler (Capacitor)
  useEffect(() => {
    if (!isOpen) return;
    const handleBack = (e: Event) => { e.preventDefault(); onClose(); };
    window.addEventListener('app-back-button', handleBack);
    return () => window.removeEventListener('app-back-button', handleBack);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!mounted) return;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, mounted]);

  if (!mounted) return null;

  const portalTarget =
    document.getElementById('modal-root') ?? document.body;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — fullscreen, above everything */}
          <motion.div
            key="backdrop"
            className="fixed inset-0"
            style={{ zIndex: 9998, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel wrapper — centered, above backdrop */}
          <div
            className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none px-5"
            style={{ zIndex: 9999 }}
          >
            <motion.div
              key="modal-panel"
              className="w-full max-w-[420px] pointer-events-auto"
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className={cn(
                  "rounded-[28px] shadow-2xl overflow-y-auto overscroll-contain",
                  "border border-[#D6E6FF]/60",
                  className
                )}
                style={{
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F9FF 100%)',
                  maxHeight: 'min(90vh, 700px)',
                  padding: '1.75rem 1.5rem',
                  paddingBottom: 'max(1.75rem, env(safe-area-inset-bottom))',
                  boxShadow: '0 24px 64px -12px rgba(0, 87, 184, 0.18), 0 4px 16px -4px rgba(0,0,0,0.12)',
                }}
              >
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    portalTarget
  )
}


interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  goalName: string
  isDeleting?: boolean
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, goalName, isDeleting }: DeleteConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
            <path d="M10 11v6"></path>
            <path d="M14 11v6"></path>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
          </svg>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground">Hapus Target?</h2>
          <p className="text-sm text-muted-foreground mt-1">Target yang akan dihapus:</p>
          <p className="font-semibold text-foreground mt-1">{goalName}</p>
        </div>

        <div className="w-full bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl p-3">
          <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
            Semua data target dan riwayat transaksi di dalamnya akan dihapus permanen dan tidak dapat dikembalikan.
          </p>
        </div>

        <div className="flex w-full space-x-3 pt-2">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
            disabled={isDeleting}
            className="flex-1 h-11 rounded-xl border border-border font-medium text-sm hover:bg-muted transition-colors disabled:opacity-50 pointer-events-auto cursor-pointer relative z-[110]"
          >
            Batal
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onConfirm(); }}
            disabled={isDeleting}
            className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Menghapus...
              </span>
            ) : "Hapus"}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function ActionSheet({ isOpen, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[200] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            className="fixed inset-x-0 bottom-0 z-[201] pb-safe sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="bg-card rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border p-4">
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
              <div className="space-y-2">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

interface DeleteTxConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isDeleting?: boolean
  tx?: { type: 'in'|'out', amount: number, note?: string, createdAt: string } | null
}

export function DeleteTxConfirmModal({ isOpen, onClose, onConfirm, isDeleting, tx }: DeleteTxConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
            <path d="M10 11v6"></path>
            <path d="M14 11v6"></path>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Hapus Transaksi?</h2>
        </div>

        {tx && (
          <div className="w-full text-left bg-muted/50 rounded-xl p-4 border border-border space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Jenis</span>
              <span className="text-xs font-semibold">{tx.type === 'in' ? 'Pemasukan' : 'Pengeluaran'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Nominal</span>
              <span className={`text-sm font-bold ${tx.type === 'in' ? 'text-emerald-500' : 'text-rose-500'}`}>
                {tx.type === 'in' ? '+' : '-'}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(tx.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Tanggal</span>
              <span className="text-xs font-medium">
                {new Date(tx.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            {tx.note && (
              <div className="flex justify-between border-t border-border pt-2 mt-2">
                <span className="text-xs text-muted-foreground">Catatan</span>
                <span className="text-xs font-medium max-w-[60%] text-right truncate">{tx.note}</span>
              </div>
            )}
          </div>
        )}

        <div className="w-full bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl p-3">
          <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
            Data transaksi ini akan dihapus dan saldo tabungan akan disesuaikan kembali (rollback) secara otomatis.
          </p>
        </div>
        <div className="flex w-full space-x-3 pt-2">
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }} disabled={isDeleting} className="flex-1 h-11 rounded-xl border border-border font-medium text-sm hover:bg-muted transition-colors disabled:opacity-50 pointer-events-auto cursor-pointer relative z-[110]">
            Batal
          </button>
          <button onClick={(e) => { e.stopPropagation(); onConfirm(); }} disabled={isDeleting} className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center">
            {isDeleting ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function BottomActionSheet({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleBack = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    window.addEventListener('app-back-button', handleBack);
    return () => window.removeEventListener('app-back-button', handleBack);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-t-[2rem] shadow-2xl overflow-hidden border-t border-slate-200 dark:border-slate-800 pb-safe"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="px-4 pb-6 pt-2 space-y-1">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm, isDeleting, count = 1 }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, isDeleting?: boolean, count?: number }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 pointer-events-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden p-6 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {count > 1 ? `Hapus ${count} target yang dipilih?` : "Hapus target ini?"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Semua riwayat tabungan pada target yang dihapus juga akan hilang selamanya.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Tombol Batal diklik!");
                  onClose();
                }}
                className="py-3 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-foreground hover:opacity-80 transition-opacity pointer-events-auto cursor-pointer relative z-[110]"
              >
                Batal
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onConfirm();
                }}
                className="py-3 rounded-full font-bold bg-rose-600 text-white shadow-md shadow-rose-500/20 hover:bg-rose-700 transition-colors pointer-events-auto cursor-pointer relative z-[110]"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
