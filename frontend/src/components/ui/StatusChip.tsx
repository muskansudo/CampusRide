import type { RideStatus } from '@/types';

const statusStyles: Record<RideStatus, { bg: string; text: string }> = {
  REQUESTED: {
    bg: 'bg-secondary-container/70',
    text: 'text-on-secondary-container',
  },
  ACCEPTED: {
    bg: 'bg-primary-fixed/60',
    text: 'text-primary',
  },
  IN_PROGRESS: {
    bg: 'bg-tertiary-container/80',
    text: 'text-on-tertiary-container',
  },
  COMPLETED: {
    bg: 'bg-surface-container-high/70',
    text: 'text-on-surface-variant',
  },
  CANCELLED: {
    bg: 'bg-error-container/80',
    text: 'text-on-error-container',
  },
};

const statusLabels: Record<RideStatus, string> = {
  REQUESTED: 'Requested',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

interface StatusChipProps {
  status: RideStatus;
}

export function StatusChip({ status }: StatusChipProps) {
  const s = statusStyles[status];
  return (
    <span
      className={[
        'inline-flex h-8 shrink-0 items-center rounded-full px-3 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm',
        s.bg,
        s.text,
      ].join(' ')}
    >
      {statusLabels[status]}
    </span>
  );
}
