import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  organizationId: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('djs_token'),
  user: JSON.parse(localStorage.getItem('djs_user') || 'null'),
  isAuthenticated: !!localStorage.getItem('djs_token'),
  login: (token, user) => {
    localStorage.setItem('djs_token', token);
    localStorage.setItem('djs_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('djs_token');
    localStorage.removeItem('djs_user');
    set({ token: null, user: null, isAuthenticated: false });
  }
}));
