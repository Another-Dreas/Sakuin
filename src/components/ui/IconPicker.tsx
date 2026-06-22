"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import {
  Target, Wallet, PiggyBank, Home, Car, Laptop, BarChart2, Coins,
  Plane, Umbrella, BookOpen, Camera, Gift, Heart, Star, Zap,
  ShoppingBag, Coffee, Music, Gamepad2, Dumbbell, Briefcase,
  GraduationCap, Baby, TreePine, Sun, Globe, Package
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export const GOAL_ICONS: Record<string, LucideIcon> = {
  Target, Wallet, PiggyBank, Home, Car, Laptop, BarChart2, Coins,
  Plane, Umbrella, BookOpen, Camera, Gift, Heart, Star, Zap,
  ShoppingBag, Coffee, Music, Gamepad2, Dumbbell, Briefcase,
  GraduationCap, Baby, TreePine, Sun, Globe, Package
}

export const DEFAULT_ICON = "Target"

interface GoalIconProps {
  name: string
  className?: string
}

export function GoalIcon({ name, className }: GoalIconProps) {
  const Icon = GOAL_ICONS[name] ?? GOAL_ICONS[DEFAULT_ICON]
  return <Icon className={cn("w-5 h-5", className)} />
}

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const SelectedIcon = GOAL_ICONS[value] ?? GOAL_ICONS[DEFAULT_ICON]

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-2xl border-2 border-border bg-muted flex items-center justify-center hover:border-primary transition-colors"
      >
        <SelectedIcon className="w-7 h-7 text-foreground" />
      </button>

      {isOpen && (
        <div className="grid grid-cols-6 gap-2 p-3 border border-border rounded-xl bg-card">
          {Object.entries(GOAL_ICONS).map(([iconName, Icon]) => (
            <button
              key={iconName}
              type="button"
              onClick={() => { onChange(iconName); setIsOpen(false) }}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-muted",
                value === iconName ? "bg-primary/10 ring-2 ring-primary" : ""
              )}
              title={iconName}
            >
              <Icon className="w-5 h-5" />
              {value === iconName && (
                <span className="sr-only"><Check className="w-3 h-3" /></span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
