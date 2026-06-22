import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  isScrolled?: boolean;
}

export function PageHeader({ title, subtitle, action, children, className, isScrolled = false }: PageHeaderProps) {
  return (
    <div 
      className={cn(
        "px-4 relative shadow-sm mb-6 flex-shrink-0 transition-all duration-300 ease-in-out",
        // The rounded edge based on isScrolled
        isScrolled ? "pb-3 rounded-b-xl" : "pb-6 rounded-b-[2rem]",
        // Light mode gradient (vibrant blue)
        "bg-[linear-gradient(135deg,#003B73_0%,#00529C_50%,#0095FF_100%)]",
        // Dark mode gradient (elegant dark navy/slate that matches --background #080f1e and --card #0d1a2e)
        "dark:bg-[linear-gradient(135deg,#0d1a2e_0%,#112240_50%,#080f1e_100%)]",
        className
      )}
      style={{ 
        // paddingTop avoids the transparent status bar overlay
        paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)"
      }}
    >
      {(title || subtitle || action) && (
        <header className="flex justify-between items-center text-white">
          <div className="flex-1 transition-all duration-300">
            {subtitle && (
              <p className={cn(
                "text-sm text-white/80 dark:text-slate-300/80 mb-0.5 transition-all duration-300",
                isScrolled ? "text-xs mb-0 opacity-0 h-0 overflow-hidden" : "opacity-100 h-auto"
              )}>
                {subtitle}
              </p>
            )}
            {title && (
              <h1 className={cn(
                "font-bold tracking-tight text-white dark:text-slate-100 transition-all duration-300",
                isScrolled ? "text-lg" : "text-2xl"
              )}>
                {title}
              </h1>
            )}
          </div>
          {action && <div className="shrink-0 ml-4">{action}</div>}
        </header>
      )}
      
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
}
