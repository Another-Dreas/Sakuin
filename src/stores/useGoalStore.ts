import { create } from 'zustand';
import { db, Goal } from '@/lib/db';

interface GoalState {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
  loadGoals: () => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'currentAmount'>) => Promise<string>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  getGoalById: (id: string) => Goal | undefined;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,
  
  loadGoals: async () => {
    if (get().goals.length === 0) {
      set({ isLoading: true, error: null });
    } else {
      set({ error: null });
    }
    try {
      const goals = await db.goals.orderBy('createdAt').reverse().toArray();
      set({ goals, isLoading: false });
    } catch (err) {
      set({ error: 'Failed to load goals', isLoading: false });
    }
  },

  addGoal: async (goalData) => {
    try {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const newGoal: Goal = {
        ...goalData,
        id,
        currentAmount: 0,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      await db.goals.add(newGoal);
      await get().loadGoals();
      return id;
    } catch (err) {
      set({ error: 'Failed to add goal' });
      throw err;
    }
  },

  updateGoal: async (id, updates) => {
    try {
      const now = new Date().toISOString();
      await db.goals.update(id, { ...updates, updatedAt: now });
      await get().loadGoals();
    } catch (err) {
      set({ error: 'Failed to update goal' });
      throw err;
    }
  },

  deleteGoal: async (id) => {
    try {
      await db.goals.delete(id);
      // Also delete related transactions
      await db.transactions.where('goalId').equals(id).delete();
      await get().loadGoals();
    } catch (err) {
      set({ error: 'Failed to delete goal' });
      throw err;
    }
  },

  getGoalById: (id) => {
    return get().goals.find((g) => g.id === id);
  },
}));
