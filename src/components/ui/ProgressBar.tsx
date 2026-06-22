import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  colorClass?: string;
  showLabel?: boolean;
}

export function ProgressBar({ progress, className, colorClass = "bg-primary", showLabel = false }: ProgressBarProps) {
  const safeProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full space-y-1">
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span className="font-medium">{safeProgress.toFixed(1)}%</span>
        </div>
      )}
      <div className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10", className)}>
        <motion.div
          className={cn("absolute left-0 top-0 h-full rounded-full", colorClass)}
          initial={{ width: 0 }}
          animate={{ width: `${safeProgress}%` }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>
    </div>
  )
}
