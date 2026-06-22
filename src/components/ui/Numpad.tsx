import React from "react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumpadProps {
  onPress: (num: string) => void;
  onDelete: () => void;
  disabled?: boolean;
  variant?: "brand" | "theme";
}

export const Numpad = React.memo(function Numpad({ onPress, onDelete, disabled = false, variant = "brand" }: NumpadProps) {
  const keys = [
    "1", "2", "3",
    "4", "5", "6",
    "7", "8", "9",
    "", "0", "delete"
  ];

  const isBrand = variant === "brand";

  return (
    <div className="grid grid-cols-3 gap-y-2 gap-x-6 max-w-xs mx-auto w-full px-4">
      {keys.map((key, i) => {
        if (key === "") return <div key={i} />;
        
        if (key === "delete") {
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 mx-auto",
                isBrand
                  ? "text-white/90 active:bg-white/20 hover:bg-white/10"
                  : "text-foreground active:bg-muted-foreground/20 hover:bg-muted-foreground/10",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <Delete className="w-7 h-7" />
            </button>
          );
        }

        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPress(key);
            }}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center text-3xl font-medium transition-all duration-200 mx-auto active:scale-95",
              isBrand
                ? "text-white active:bg-white/20 hover:bg-white/10 border border-white/10 bg-white/5"
                : "text-foreground active:bg-primary/20 hover:bg-muted border border-border bg-card shadow-sm dark:bg-[#1E293B] dark:border-[#334155]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {key}
          </button>
        );
      })}
    </div>
  );
});
