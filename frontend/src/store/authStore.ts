import { create } from 'zustand';
import type { User } from '../types';
import { api } from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { getToken, removeToken, setToken } from '../lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: true,

  login: async (email, password) => {
    const { user, token } = await api.login(email, password);
    setToken(token);
    connectSocket(token);
    set({ user, token });
  },

  register: async (data) => {
    const { user, token } = await api.register(data);
    setToken(token);
    connectSocket(token);
    set({ user, token });
  },

  logout: () => {
    removeToken();
    disconnectSocket();
    set({ user: null, token: null });
  },

  updateProfile: async (data) => {
    const updated = await api.updateProfile(data);
    set({ user: { ...get().user!, ...updated } });
  },

  loadUser: async () => {
    const token = getToken();
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      connectSocket(token);
      const user = await api.getMe();
      set({ user, token, loading: false });
    } catch {
      removeToken();
      disconnectSocket();
      set({ user: null, token: null, loading: false });
    }
  },
}));
