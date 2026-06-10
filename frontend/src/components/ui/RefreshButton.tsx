import { RefreshCw } from 'lucide-react';

type RefreshButtonVariant = 'header' | 'map';

const variantClasses: Record<RefreshButtonVariant, string> = {
  header:
    'flex h-10 w-10 items-center justify-center rounded-full glass text-primary hover:bg-white/50 disabled:opacity-50',
  map: 'flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-primary shadow hover:bg-white disabled:opacity-50',
};

interface RefreshButtonProps {
  onClick: () => void;
  refreshing: boolean;
  variant?: RefreshButtonVariant;
  className?: string;
}

export function RefreshButton({
  onClick,
  refreshing,
  variant = 'header',
  className = '',
}: RefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={refreshing}
      className={[
        'refresh-btn-glow',
        variantClasses[variant],
        refreshing ? 'is-refreshing' : '',
        className,
      ].join(' ')}
      aria-label="Refresh"
    >
      <RefreshCw className={['h-4 w-4', refreshing ? 'animate-spin' : ''].join(' ')} />
    </button>
  );
}
