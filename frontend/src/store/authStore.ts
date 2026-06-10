import { create } from 'zustand';
import type { User } from '../types';
import { api } from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string }) => Promise<void>;
  updateVehicle: (data: {
    vehicleType?: string;
    vehicleNumber?: string;
  }) => Promise<void>;
  submitVerification: (data: {
    licenseNumber: string;
    governmentIdNumber: string;
  }) => Promise<void>;
  updateUpiId: (upiId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,

  login: async (email, password) => {
    const { user } = await api.login(email, password);
    connectSocket();
    set({ user });
  },

  register: async (data) => {
    const { user } = await api.register(data);
    connectSocket();
    set({ user });
  },

  logout: async () => {
    const user = get().user;
    if (user?.role === 'DRIVER' && user.driverProfile?.isOnline) {
      try {
        await api.updateDriverStatus(false);
      } catch {
      }
    }
    try {
      await api.logout();
    } catch {
    }
    disconnectSocket();
    set({ user: null });
  },

  updateProfile: async (data) => {
    const updated = await api.updateProfile(data);
    set({ user: { ...get().user!, ...updated } });
  },

  updateVehicle: async (data) => {
    const profile = await api.updateVehicle(data);
    const user = get().user!;
    set({
      user: {
        ...user,
        driverProfile: user.driverProfile
          ? { ...user.driverProfile, ...profile }
          : {
              ...profile,
              verificationStatus: profile.verificationStatus ?? 'PENDING',
              isOnline: profile.isOnline ?? false,
            },
      },
    });
  },

  submitVerification: async (data) => {
    const profile = await api.submitVerification(data);
    const user = get().user!;
    set({
      user: {
        ...user,
        driverProfile: user.driverProfile
          ? { ...user.driverProfile, ...profile }
          : null,
      },
    });
  },

  updateUpiId: async (upiId: string) => {
    const profile = await api.updateDriverUpiId(upiId);
    const user = get().user!;
    set({
      user: {
        ...user,
        driverProfile: user.driverProfile
          ? { ...user.driverProfile, ...profile }
          : null,
      },
    });
  },

  loadUser: async () => {
    localStorage.removeItem('token');
    try {
      const user = await api.getMe();
      connectSocket();
      set({ user, loading: false });
    } catch {
      disconnectSocket();
      set({ user: null, loading: false });
    }
  },

  refreshUser: async () => {
    const user = await api.getMe();
    set({ user });
  },
}));
