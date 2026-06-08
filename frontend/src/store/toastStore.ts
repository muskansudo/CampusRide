import { create } from 'zustand';
import type { Toast } from '../types';

interface ToastState {
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (type, message) => {
    const id = crypto.randomUUID();
    set((s) => ({
      toasts: [...s.toasts.slice(-2), { id, type, message }],
    }));
    setTimeout(() => get().removeToast(id), 3500);
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
