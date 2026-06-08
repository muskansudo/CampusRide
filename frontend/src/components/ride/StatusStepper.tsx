import type { RideStatus } from '@/types';
import { Check } from 'lucide-react';

const STEPS: { status: RideStatus; label: string }[] = [
  { status: 'REQUESTED', label: 'Requested' },
  { status: 'ACCEPTED', label: 'Accepted' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'COMPLETED', label: 'Completed' },
];

const statusOrder: RideStatus[] = ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];

interface StatusStepperProps {
  status: RideStatus;
}

export function StatusStepper({ status }: StatusStepperProps) {
  if (status === 'CANCELLED') {
    return (
      <p className="text-center text-sm font-medium text-error">Ride cancelled</p>
    );
  }

  const currentIndex = statusOrder.indexOf(status);

  return (
    <div className="flex items-center justify-between gap-1">
      {STEPS.map((step, index) => {
        const done = index <= currentIndex;
        const active = index === currentIndex;
        const isLive = step.status === 'IN_PROGRESS' && active;

        return (
          <div key={step.status} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-center">
              {index > 0 && (
                <div
                  className={[
                    'h-0.5 flex-1',
                    done ? 'bg-primary/60' : 'bg-outline-variant/40',
                  ].join(' ')}
                />
              )}
              <div
                className={[
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition',
                  done
                    ? isLive
                      ? 'border-tertiary-container bg-tertiary-container/30 text-tertiary shadow-[0_0_12px_var(--color-live-glow)]'
                      : 'border-primary bg-primary text-on-primary'
                    : 'border-outline-variant/50 bg-white/20 text-outline',
                ].join(' ')}
              >
                {done && !isLive ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={[
                    'h-0.5 flex-1',
                    index < currentIndex ? 'bg-primary/60' : 'bg-outline-variant/40',
                  ].join(' ')}
                />
              )}
            </div>
            <span
              className={[
                'text-[10px] font-semibold uppercase tracking-wide',
                active ? 'text-primary' : 'text-outline',
              ].join(' ')}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
