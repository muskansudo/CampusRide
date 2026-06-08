import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const colors = {
  success: 'text-primary',
  error: 'text-red-400',
  info: 'text-on-surface-variant',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return createPortal(
    <div className="fixed top-4 left-1/2 z-[200] flex w-[calc(100%-48px)] max-w-[380px] -translate-x-1/2 flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className="glass silk-border flex items-center gap-3 rounded-full px-5 py-3 text-sm font-medium shadow-lg page-enter"
          >
            <Icon className={['h-4 w-4 shrink-0', colors[toast.type]].join(' ')} />
            <span className="flex-1 text-on-surface">{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="ml-1 shrink-0 text-outline hover:text-on-surface transition"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
