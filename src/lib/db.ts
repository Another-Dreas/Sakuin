import Dexie, { type Table } from 'dexie';

export type GoalStatus = 'active' | 'completed' | 'archived';
export type TransactionType = 'in' | 'out';

export interface Goal {
  id?: string;
  name: string;
  icon: string;
  targetAmount: number;
  currentAmount: number;
  description?: string;
  deadline?: string; // ISO Date string
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  status: GoalStatus;
  themeColor: string; // E.g., 'blue', 'indigo', 'rose', 'amber', etc.
}

export interface Transaction {
  id?: string;
  goalId: string;
  type: TransactionType;
  amount: number;
  note?: string;
  createdAt: string; // ISO Date string
}

export interface Settings {
  id?: number; // Always 1
  pin: string | null;
  biometricEnabled: boolean;
  darkMode: boolean;
  currency: string;
  securityQuestion?: string;
  securityAnswer?: string;
  isBalanceHidden?: boolean;
}

export class SakuinDB extends Dexie {
  goals!: Table<Goal, string>;
  transactions!: Table<Transaction, string>;
  settings!: Table<Settings, number>;

  constructor() {
    super('SakuinDatabase');
    this.version(1).stores({
      goals: 'id, status, createdAt', // id is primary key, status and createdAt are indexed
      transactions: 'id, goalId, type, createdAt', // id is primary key, others are indexed
      settings: 'id',
    });
  }
}

export const db = new SakuinDB();
