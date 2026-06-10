import { create } from 'zustand';

export type SocketStatus = 'connected' | 'disconnected' | 'reconnecting';

interface NetworkState {
  isOnline: boolean;
  socketStatus: SocketStatus;
  showReconnected: boolean;
  setOnline: (online: boolean) => void;
  setSocketStatus: (status: SocketStatus) => void;
  flashReconnected: () => void;
  clearReconnected: () => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  socketStatus: 'disconnected',
  showReconnected: false,
  setOnline: (isOnline) => set({ isOnline }),
  setSocketStatus: (socketStatus) => set({ socketStatus }),
  flashReconnected: () => set({ showReconnected: true }),
  clearReconnected: () => set({ showReconnected: false }),
}));
