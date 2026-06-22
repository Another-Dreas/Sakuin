import { create } from 'zustand';
import { db, Settings } from '@/lib/db';

interface SettingsState {
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  // isLocked = PIN wall shown at app open. isAuthenticated = user passed PIN for this session.
  isLocked: boolean;
  isAuthenticated: boolean;
  setLocked: (locked: boolean) => void;
  authenticate: () => void;
  toggleHideBalance: () => Promise<void>;
  // Persistent state is used directly via `settings.isBalanceHidden`
}

const defaultSettings: Settings = {
  id: 1,
  pin: null,
  biometricEnabled: false,
  darkMode: false,
  currency: 'IDR',
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: true,
  error: null,
  isLocked: false,
  isAuthenticated: false,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      let settings = await db.settings.get(1);
      if (!settings) {
        await db.settings.add(defaultSettings);
        settings = defaultSettings;
      }
      // Only lock if PIN is set AND user has not authenticated yet this session
      const alreadyAuth = get().isAuthenticated;
      const isLocked = !!settings.pin && !alreadyAuth;
      set({ settings, isLoading: false, isLocked });
    } catch {
      set({ error: 'Failed to load settings', isLoading: false });
    }
  },

  updateSettings: async (updates) => {
    try {
      const currentSettings = get().settings || defaultSettings;
      const newSettings = { ...currentSettings, ...updates };
      await db.settings.put(newSettings);
      set({ settings: newSettings });
    } catch {
      set({ error: 'Failed to update settings' });
      throw new Error('Failed to update settings');
    }
  },

  setLocked: (locked) => {
    set({ isLocked: locked });
    if (!locked) set({ isAuthenticated: true });
  },

  authenticate: () => {
    set({ isLocked: false, isAuthenticated: true });
  },

  toggleHideBalance: async () => {
    const { settings, updateSettings } = get();
    if (settings) {
      // Toggle the boolean directly in persistent DB
      await updateSettings({ isBalanceHidden: !settings.isBalanceHidden });
    }
  },
}));
