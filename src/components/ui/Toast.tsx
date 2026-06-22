"use client";

import { useToastStore } from "@/stores/useToastStore";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex flex-col items-center space-y-2 pointer-events-none px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="pointer-events-auto bg-card border border-border shadow-lg rounded-2xl p-4 w-full max-w-sm flex items-start space-x-3"
          >
            {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />}
            {toast.type === "error" && <XCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{toast.title}</p>
              {toast.amount !== undefined && (
                <p className={`text-base font-bold mt-1 ${toast.type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {toast.type === "success" ? "+" : "-"} {formatCurrency(toast.amount)}
                </p>
              )}
              {toast.message && <p className="text-xs text-muted-foreground mt-1">{toast.message}</p>}
            </div>
            <button onClick={() => removeToast(toast.id)} className="p-1 -mr-1 -mt-1 rounded-full hover:bg-muted text-muted-foreground transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
