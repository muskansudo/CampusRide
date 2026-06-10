import { create } from 'zustand';

interface RideRequestState {
  count: number;
  increment: () => void;
  decrement: () => void;
  clear: () => void;
}

export const useRideRequestStore = create<RideRequestState>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: Math.min(s.count + 1, 99) })),
  decrement: () => set((s) => ({ count: Math.max(s.count - 1, 0) })),
  clear: () => set({ count: 0 }),
}));
