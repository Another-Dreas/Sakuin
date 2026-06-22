"use client"

import { Home, Target, History, Settings, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "goals", label: "Target", icon: Target },
  { id: "transactions", label: "Riwayat", icon: History },
  { id: "statistics", label: "Statistik", icon: BarChart2 },
  { id: "settings", label: "Setelan", icon: Settings },
];

interface BottomNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  className?: string;
}

export function BottomNavigation({ activeTab, setActiveTab, className }: BottomNavigationProps) {
  // KEY: This component is NOT position:fixed.
  // It is a normal flex child of AppWrapper's fixed container.
  // position:fixed on nav causes touch-event interception bugs in Capacitor Android WebView.
  return (
    <nav
      className={cn("shrink-0 bg-background border-t border-border relative z-[9999] pointer-events-auto", className)}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        // Prevent any touch delay on Android
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      } as React.CSSProperties}
    >
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Determine if tab is active based on state id
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab(item.id); // Hanya ubah state internal, tanpa menyentuh URL!
              }}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors select-none",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-primary"
              )}
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              } as React.CSSProperties}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
