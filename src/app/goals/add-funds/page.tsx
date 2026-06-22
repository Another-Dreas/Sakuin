"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { useGoalStore } from "@/stores/useGoalStore";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, ArrowDownCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { Currency } from "@/components/ui/Currency";
import { useToastStore } from "@/stores/useToastStore";

const formSchema = z.object({
  amount: z.number().min(1000, "Nominal minimal Rp 1.000"),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function AddFundsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  
  const { addTransaction } = useTransactionStore();
  const { getGoalById, loadGoals } = useGoalStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goal = id ? getGoalById(id) : undefined;

  useEffect(() => {
    if (!goal) loadGoals();
  }, [goal, loadGoals]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const { addToast } = useToastStore();

  const onSubmit = async (data: FormValues) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await addTransaction(id, "in", data.amount, data.note);
      addToast({
        type: "success",
        title: "Dana masuk berhasil",
        amount: data.amount,
      });
      router.push(`/goals/detail?id=${id}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!id || !goal) return null;

  return (
    <div className="flex flex-col min-h-full p-4 pt-8 pb-4 space-y-6">
      <header className="flex items-center space-x-3">
        <Link href={`/goals/detail?id=${id}`} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Tambah Dana</h1>
      </header>

      <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/50">
        <CardContent className="p-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center dark:bg-emerald-900/50 dark:text-emerald-400">
            <ArrowDownCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Menabung untuk</p>
            <p className="font-bold text-emerald-900 dark:text-emerald-100">{goal.name}</p>
            <p className="text-xs text-emerald-700/80 mt-1 dark:text-emerald-300/80">Terkumpul: <Currency amount={goal.currentAmount} /></p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nominal (Rp)</label>
              <Input 
                type="number" 
                placeholder="0" 
                className="text-2xl font-bold h-14"
                {...register("amount", { valueAsNumber: true })} 
              />
              {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan (Opsional)</label>
              <Input placeholder="Gaji bulan ini, sisa jajan..." {...register("note")} />
            </div>

            <Button type="submit" className="w-full mt-6 h-12 text-lg bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Uang Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AddFundsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <AddFundsContent />
    </Suspense>
  );
}
