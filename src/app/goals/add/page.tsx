"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGoalStore } from "@/stores/useGoalStore";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconPicker } from "@/components/ui/IconPicker";
import { ArrowLeft, Check, CalendarIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(3, "Nama target minimal 3 karakter"),
  icon: z.string().min(1, "Pilih ikon"),
  targetAmount: z.number().min(1000, "Target dana minimal Rp 1.000"),
  description: z.string().optional(),
  deadline: z.string().optional(),
  themeColor: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

// Restricted to 6 brand colors
const THEME_COLORS = [
  { id: "indigo",  label: "Nila",  bg: "bg-indigo-500",  hex: "#6366f1" },
  { id: "rose",    label: "Merah", bg: "bg-rose-500",    hex: "#f43f5e" },
  { id: "blue",    label: "Biru",  bg: "bg-blue-500",    hex: "#3b82f6" },
  { id: "emerald", label: "Hijau", bg: "bg-emerald-500", hex: "#10b981" },
  { id: "slate",   label: "Hitam", bg: "bg-slate-700",   hex: "#334155" },
  { id: "amber",   label: "Emas",  bg: "bg-amber-500",   hex: "#f59e0b" },
];

export default function AddGoalPage() {
  const router = useRouter();
  const { addGoal } = useGoalStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      themeColor: "blue",
      icon: "Target",
    }
  });

  const selectedColor = watch("themeColor");
  const selectedIcon = watch("icon");

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await addGoal({
        name: data.name,
        icon: data.icon,
        targetAmount: data.targetAmount,
        description: data.description,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : undefined,
        themeColor: data.themeColor,
      });
      router.push("/goals");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="flex-none flex items-center space-x-3 p-4 pt-8 pb-4 border-b border-border shadow-sm z-20 bg-background relative">
        <Link href="/goals" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Buat Target Baru</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-6 pb-safe space-y-5 z-10 relative max-h-[85vh]">

      <Card>
        <CardContent className="p-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Target</label>
              <Input placeholder="Contoh: Laptop Gaming" {...register("name")} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Ikon</label>
              <IconPicker value={selectedIcon} onChange={(v) => setValue("icon", v)} />
              {errors.icon && <p className="text-xs text-red-500">{errors.icon.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Target Dana (Rp)</label>
              <Input
                type="number"
                placeholder="0"
                className="h-12 rounded-xl text-lg font-medium"
                {...register("targetAmount", { valueAsNumber: true })}
              />
              {errors.targetAmount && <p className="text-xs text-red-500">{errors.targetAmount.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Deadline (Opsional)</label>
              <div className="relative">
                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type="date" className="pl-11 h-12 rounded-xl" {...register("deadline")} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Deskripsi (Opsional)</label>
              <Input placeholder="Catatan singkat tentang target ini..." className="h-12 rounded-xl" {...register("description")} />
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium">Warna Tema</label>
              <div className="grid grid-cols-3 gap-3">
                {THEME_COLORS.map((color) => {
                  const isActive = selectedColor === color.id;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setValue("themeColor", color.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all space-y-2",
                        isActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                      )}
                      aria-label={`Pilih warna ${color.label}`}
                    >
                      <div className={`w-8 h-8 rounded-full ${color.bg} flex items-center justify-center shadow-sm`}>
                        {isActive && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <span className={cn("text-xs font-medium", isActive ? "text-primary" : "text-muted-foreground")}>{color.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button type="submit" className="w-full h-14 rounded-xl text-base font-bold mt-4" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Target"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
