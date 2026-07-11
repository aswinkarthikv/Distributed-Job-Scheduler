import { create } from 'zustand';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
}

interface SettingsState {
  profile: { name: string; email: string };
  organization: { name: string; plan: string };
  apiKeys: ApiKey[];
  retryPolicies: {
    defaultAttempts: number;
    backoffFactor: number;
    maxDelayMs: number;
  };
  updateProfile: (name: string, email: string) => void;
  updateOrg: (name: string) => void;
  addApiKey: (name: string) => void;
  deleteApiKey: (id: string) => void;
  updateRetryPolicy: (policy: Partial<SettingsState['retryPolicies']>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  profile: { name: 'Staff Engineer', email: 'staff@enterprise.io' },
  organization: { name: 'Acme Jobs Corp', plan: 'Enterprise' },
  apiKeys: [
    { id: 'key-1', name: 'Production Agent', key: 'djs_prod_live_8f3a92c90df1b8b', createdAt: '2026-01-10T12:00:00Z' }
  ],
  retryPolicies: {
    defaultAttempts: 3,
    backoffFactor: 2,
    maxDelayMs: 30000
  },
  updateProfile: (name, email) => set((state) => ({ profile: { ...state.profile, name, email } })),
  updateOrg: (name) => set((state) => ({ organization: { ...state.organization, name } })),
  addApiKey: (name) => set((state) => {
    const randomHex = Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join('');
    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name,
      key: `djs_prod_live_${randomHex}`,
      createdAt: new Date().toISOString()
    };
    return { apiKeys: [...state.apiKeys, newKey] };
  }),
  deleteApiKey: (id) => set((state) => ({ apiKeys: state.apiKeys.filter(k => k.id !== id) })),
  updateRetryPolicy: (policy) => set((state) => ({ retryPolicies: { ...state.retryPolicies, ...policy } }))
}));
