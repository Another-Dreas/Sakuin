"use client";
import { formatCurrency } from "@/lib/utils";
import { useSettingsStore } from "@/stores/useSettingsStore";

/**
 * Currency — renders a monetary amount.
 * Balance visibility is persistently read from settings.isBalanceHidden.
 */
export function Currency({ amount }: { amount: number }) {
  const isHidden = useSettingsStore(s => s.settings?.isBalanceHidden);

  // use suppressHydrationWarning because the server will always render •••••••••• initially,
  // but it will quickly swap out when AppWrapper resolves isLoading locally.
  if (isHidden) {
    return <span className="truncate max-w-full inline-block align-bottom" suppressHydrationWarning aria-label="Saldo disembunyikan">••••••••••</span>;
  }

  return <span className="truncate max-w-full inline-block align-bottom" suppressHydrationWarning>{formatCurrency(amount)}</span>;
}
