import { create } from 'zustand';
import { db, Transaction, TransactionType } from '@/lib/db';
import { useGoalStore } from './useGoalStore';

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  loadTransactions: () => Promise<void>;
  addTransaction: (goalId: string, type: TransactionType, amount: number, note?: string) => Promise<string>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactionsByGoalId: (goalId: string) => Transaction[];
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  
  loadTransactions: async () => {
    if (get().transactions.length === 0) {
      set({ isLoading: true, error: null });
    } else {
      set({ error: null });
    }
    try {
      const transactions = await db.transactions.orderBy('createdAt').reverse().toArray();
      set({ transactions, isLoading: false });
    } catch (err) {
      set({ error: 'Failed to load transactions', isLoading: false });
    }
  },

  addTransaction: async (goalId, type, amount, note) => {
    try {
      const id = crypto.randomUUID();
      const newTransaction: Transaction = {
        id,
        goalId,
        type,
        amount,
        note,
        createdAt: new Date().toISOString(),
      };
      
      await db.transaction('rw', db.transactions, db.goals, async () => {
        await db.transactions.add(newTransaction);
        
        // Update goal currentAmount
        const goal = await db.goals.get(goalId);
        if (goal) {
          const newAmount = type === 'in' ? goal.currentAmount + amount : goal.currentAmount - amount;
          const status = newAmount >= goal.targetAmount ? 'completed' : goal.status === 'completed' && newAmount < goal.targetAmount ? 'active' : goal.status;
          await db.goals.update(goalId, { 
            currentAmount: newAmount, 
            status,
            updatedAt: new Date().toISOString()
          });
        }
      });
      
      await get().loadTransactions();
      // Also refresh goals store to reflect updated amount
      await useGoalStore.getState().loadGoals();
      return id;
    } catch (err) {
      set({ error: 'Failed to add transaction' });
      throw err;
    }
  },

  deleteTransaction: async (id) => {
    try {
      await db.transaction('rw', db.transactions, db.goals, async () => {
        const tx = await db.transactions.get(id);
        if (!tx) throw new Error('Transaction not found');

        const goal = await db.goals.get(tx.goalId);
        if (goal) {
          // Rollback logic:
          // If transaction was 'in', we subtract the amount from the current goal balance
          // If transaction was 'out', we add the amount back to the goal balance
          let newAmount = tx.type === 'in' ? goal.currentAmount - tx.amount : goal.currentAmount + tx.amount;
          
          // Ensure it doesn't go below 0 just in case
          newAmount = Math.max(0, newAmount);

          const status = newAmount >= goal.targetAmount ? 'completed' : 'active';
          
          if (goal.id) {
            await db.goals.update(goal.id, { 
              currentAmount: newAmount, 
              status,
              updatedAt: new Date().toISOString()
            });
          }
        }

        // Delete the transaction
        await db.transactions.delete(id);
      });
      
      await get().loadTransactions();
      await useGoalStore.getState().loadGoals();
    } catch (err) {
      set({ error: 'Failed to delete transaction' });
      throw err;
    }
  },

  getTransactionsByGoalId: (goalId) => {
    return get().transactions.filter((t) => t.goalId === goalId);
  },
}));
