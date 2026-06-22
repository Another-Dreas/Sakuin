export type ThemeStyle = {
  cardBg: string;
  cardBorder: string;
  iconBg: string;
  iconColor: string;
  textPrimary: string;
  textSecondary: string;
  progressTrack: string;
  progressFill: string;
};

export const THEME_COLORS: Record<string, { label: string; bg: string; border: string }> = {
  blue: { label: "Sky Premium Blue", bg: "#3B82F6", border: "#2563eb" },
  indigo: { label: "Indigo Amethyst", bg: "#6366F1", border: "#4f46e5" },
  rose: { label: "Vibrant Rose", bg: "#F43F5E", border: "#e11d48" },
  emerald: { label: "Emerald Fresh Green", bg: "#10B981", border: "#059669" },
  amber: { label: "Radiant Amber", bg: "#F59E0B", border: "#d97706" },
  slate: { label: "Modern Slate Gray", bg: "#64748B", border: "#475569" },
};

export function getThemeStyle(color: string): ThemeStyle {
  switch (color) {
    case "indigo":
      return {
        cardBg: "bg-white dark:bg-slate-900/40",
        cardBorder: "border-slate-100 dark:border-slate-800/60",
        iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
        iconColor: "text-indigo-600 dark:text-indigo-400",
        textPrimary: "text-slate-800 dark:text-slate-100",
        textSecondary: "text-slate-500 dark:text-slate-400",
        progressTrack: "bg-slate-100 dark:bg-slate-800",
        progressFill: "bg-indigo-500",
      };
    case "rose":
      return {
        cardBg: "bg-white dark:bg-slate-900/40",
        cardBorder: "border-slate-100 dark:border-slate-800/60",
        iconBg: "bg-rose-100 dark:bg-rose-900/40",
        iconColor: "text-rose-600 dark:text-rose-400",
        textPrimary: "text-slate-800 dark:text-slate-100",
        textSecondary: "text-slate-500 dark:text-slate-400",
        progressTrack: "bg-slate-100 dark:bg-slate-800",
        progressFill: "bg-rose-500",
      };
    case "blue":
      return {
        cardBg: "bg-white dark:bg-slate-900/40",
        cardBorder: "border-slate-100 dark:border-slate-800/60",
        iconBg: "bg-blue-100 dark:bg-blue-900/40",
        iconColor: "text-blue-600 dark:text-blue-400",
        textPrimary: "text-slate-800 dark:text-slate-100",
        textSecondary: "text-slate-500 dark:text-slate-400",
        progressTrack: "bg-slate-100 dark:bg-slate-800",
        progressFill: "bg-blue-500",
      };
    case "emerald":
      return {
        cardBg: "bg-white dark:bg-slate-900/40",
        cardBorder: "border-slate-100 dark:border-slate-800/60",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        textPrimary: "text-slate-800 dark:text-slate-100",
        textSecondary: "text-slate-500 dark:text-slate-400",
        progressTrack: "bg-slate-100 dark:bg-slate-800",
        progressFill: "bg-emerald-500",
      };
    case "slate":
      return {
        cardBg: "bg-white dark:bg-slate-900/40",
        cardBorder: "border-slate-100 dark:border-slate-800/60",
        iconBg: "bg-slate-100 dark:bg-slate-800/60",
        iconColor: "text-slate-700 dark:text-slate-300",
        textPrimary: "text-slate-800 dark:text-slate-100",
        textSecondary: "text-slate-500 dark:text-slate-400",
        progressTrack: "bg-slate-100 dark:bg-slate-800",
        progressFill: "bg-slate-700 dark:bg-slate-400",
      };
    case "amber":
      return {
        cardBg: "bg-white dark:bg-slate-900/40",
        cardBorder: "border-slate-100 dark:border-slate-800/60",
        iconBg: "bg-amber-100 dark:bg-amber-900/40",
        iconColor: "text-amber-600 dark:text-amber-400",
        textPrimary: "text-slate-800 dark:text-slate-100",
        textSecondary: "text-slate-500 dark:text-slate-400",
        progressTrack: "bg-slate-100 dark:bg-slate-800",
        progressFill: "bg-amber-500",
      };
    default:
      return getThemeStyle("blue");
  }
}

// ─── Detail Hero Card: Full-gradient style ───────────────────────────────────
// Used exclusively on the Goal Detail page for a premium, immersive hero card.
// Light mode  → vibrant gradient background, all-white text.
// Dark mode   → deep neutral base + colored border glow + white text.

export type DetailHeroStyle = {
  /** Card gradient (light) / dark neutral (dark) */
  heroBg: string;
  /** Subtle border / colored glow in dark */
  heroBorder: string;
  /** Drop-shadow matching the theme hue */
  heroShadow: string;
  /** Circular decoration rings inside card */
  heroRing: string;
  /** Icon container */
  heroIconBg: string;
  heroIconColor: string;
  /** All text inside the card */
  heroTextPrimary: string;
  heroTextSecondary: string;
  /** Horizontal dividers */
  heroDivider: string;
  /** Progress bar */
  heroProgressTrack: string;
  heroProgressFill: string;
};

const DETAIL_HERO: Record<string, DetailHeroStyle> = {
  indigo: {
    heroBg:            "bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 dark:from-[#0d1a2e] dark:via-[#0d1a2e] dark:to-[#0d1a2e]",
    heroBorder:        "border border-indigo-400/30 dark:border-indigo-500/50",
    heroShadow:        "shadow-xl shadow-indigo-500/30 dark:shadow-indigo-500/10",
    heroRing:          "bg-indigo-400/20",
    heroIconBg:        "bg-white/20 dark:bg-indigo-900/50",
    heroIconColor:     "text-white dark:text-indigo-300",
    heroTextPrimary:   "text-white",
    heroTextSecondary: "text-indigo-100/80 dark:text-slate-400",
    heroDivider:       "border-white/20 dark:border-slate-700/60",
    heroProgressTrack: "bg-white/20 dark:bg-slate-800",
    heroProgressFill:  "bg-white dark:bg-indigo-400",
  },
  rose: {
    heroBg:            "bg-gradient-to-br from-rose-600 via-rose-500 to-pink-500 dark:from-[#0d1a2e] dark:via-[#0d1a2e] dark:to-[#0d1a2e]",
    heroBorder:        "border border-rose-400/30 dark:border-rose-500/50",
    heroShadow:        "shadow-xl shadow-rose-500/30 dark:shadow-rose-500/10",
    heroRing:          "bg-rose-400/20",
    heroIconBg:        "bg-white/20 dark:bg-rose-900/50",
    heroIconColor:     "text-white dark:text-rose-300",
    heroTextPrimary:   "text-white",
    heroTextSecondary: "text-rose-100/80 dark:text-slate-400",
    heroDivider:       "border-white/20 dark:border-slate-700/60",
    heroProgressTrack: "bg-white/20 dark:bg-slate-800",
    heroProgressFill:  "bg-white dark:bg-rose-400",
  },
  blue: {
    heroBg:            "bg-gradient-to-r from-[#003b80] to-[#0080ff] dark:from-[#0d1a2e] dark:to-[#0d1a2e]",
    heroBorder:        "border border-white/10 dark:border-blue-500/50",
    heroShadow:        "shadow-lg shadow-blue-500/30 dark:shadow-blue-500/10",
    heroRing:          "bg-white/10",
    heroIconBg:        "bg-white/20 dark:bg-blue-900/50",
    heroIconColor:     "text-white dark:text-blue-300",
    heroTextPrimary:   "text-white",
    heroTextSecondary: "text-blue-100 dark:text-slate-400",
    heroDivider:       "border-white/20 dark:border-slate-700/60",
    heroProgressTrack: "bg-white/20 dark:bg-slate-800",
    heroProgressFill:  "bg-white dark:bg-blue-400",
  },
  emerald: {
    heroBg:            "bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 dark:from-[#0d1a2e] dark:via-[#0d1a2e] dark:to-[#0d1a2e]",
    heroBorder:        "border border-emerald-400/30 dark:border-emerald-500/50",
    heroShadow:        "shadow-xl shadow-emerald-500/30 dark:shadow-emerald-500/10",
    heroRing:          "bg-emerald-400/20",
    heroIconBg:        "bg-white/20 dark:bg-emerald-900/50",
    heroIconColor:     "text-white dark:text-emerald-300",
    heroTextPrimary:   "text-white",
    heroTextSecondary: "text-emerald-100/80 dark:text-slate-400",
    heroDivider:       "border-white/20 dark:border-slate-700/60",
    heroProgressTrack: "bg-white/20 dark:bg-slate-800",
    heroProgressFill:  "bg-white dark:bg-emerald-400",
  },
  slate: {
    heroBg:            "bg-gradient-to-br from-slate-700 via-slate-600 to-slate-500 dark:from-[#0d1a2e] dark:via-[#0d1a2e] dark:to-[#0d1a2e]",
    heroBorder:        "border border-slate-500/40 dark:border-slate-500/50",
    heroShadow:        "shadow-xl shadow-slate-500/20 dark:shadow-slate-600/10",
    heroRing:          "bg-slate-400/20",
    heroIconBg:        "bg-white/15 dark:bg-slate-700/60",
    heroIconColor:     "text-white dark:text-slate-300",
    heroTextPrimary:   "text-white",
    heroTextSecondary: "text-slate-200/80 dark:text-slate-400",
    heroDivider:       "border-white/20 dark:border-slate-700/60",
    heroProgressTrack: "bg-white/20 dark:bg-slate-800",
    heroProgressFill:  "bg-white dark:bg-slate-400",
  },
  amber: {
    heroBg:            "bg-gradient-to-br from-amber-500 via-amber-400 to-orange-400 dark:from-[#0d1a2e] dark:via-[#0d1a2e] dark:to-[#0d1a2e]",
    heroBorder:        "border border-amber-400/30 dark:border-amber-500/50",
    heroShadow:        "shadow-xl shadow-amber-500/30 dark:shadow-amber-500/10",
    heroRing:          "bg-amber-400/20",
    heroIconBg:        "bg-white/20 dark:bg-amber-900/50",
    heroIconColor:     "text-white dark:text-amber-300",
    heroTextPrimary:   "text-white",
    heroTextSecondary: "text-amber-100/80 dark:text-slate-400",
    heroDivider:       "border-white/20 dark:border-slate-700/60",
    heroProgressTrack: "bg-white/20 dark:bg-slate-800",
    heroProgressFill:  "bg-white dark:bg-amber-400",
  },
};

export function getDetailHeroStyle(color: string): DetailHeroStyle {
  return DETAIL_HERO[color] ?? DETAIL_HERO["blue"];
}
