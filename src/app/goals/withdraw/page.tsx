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
import { ArrowLeft, ArrowUpCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { Currency } from "@/components/ui/Currency";
import { useToastStore } from "@/stores/useToastStore";

const formSchema = z.object({
  amount: z.number().min(1000, "Nominal minimal Rp 1.000"),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function WithdrawFundsContent() {
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

  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const { addToast } = useToastStore();

  const onSubmit = async (data: FormValues) => {
    if (!id || !goal) return;
    
    if (data.amount > goal.currentAmount) {
      setError("amount", { type: "manual", message: "Saldo tidak mencukupi untuk ditarik" });
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction(id, "out", data.amount, data.note);
      addToast({
        type: "error", // red color toast for withdraw
        title: "Dana keluar berhasil",
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
        <h1 className="text-xl font-bold">Tarik Dana</h1>
      </header>

      <Card className="border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900/50">
        <CardContent className="p-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center dark:bg-rose-900/50 dark:text-rose-400">
            <ArrowUpCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-rose-800 dark:text-rose-300">Menarik dari tabungan</p>
            <p className="font-bold text-rose-900 dark:text-rose-100">{goal.name}</p>
            <p className="text-xs text-rose-700/80 mt-1 dark:text-rose-300/80">Saldo: <Currency amount={goal.currentAmount} /></p>
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
              <Input placeholder="Beli barang, keperluan mendadak..." {...register("note")} />
            </div>

            <Button type="submit" variant="destructive" className="w-full mt-6 h-12 text-lg" disabled={isSubmitting}>
              {isSubmitting ? "Memproses..." : "Tarik Dana"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function WithdrawFundsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <WithdrawFundsContent />
    </Suspense>
  );
}
