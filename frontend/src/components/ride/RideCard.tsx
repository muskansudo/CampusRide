import { CalendarClock, MapPin, Navigation } from 'lucide-react';
import type { Ride } from '@/types';
import { Card } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { Button } from '@/components/ui/Button';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { StatusStepper } from './StatusStepper';

interface RideCardProps {
  ride: Ride;
  role: 'passenger' | 'driver';
  embedded?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function RideCard({
  ride,
  role,
  embedded,
  onAccept,
  onReject,
  onStart,
  onComplete,
  onCancel,
  loading,
}: RideCardProps) {
  const isLive = ['ACCEPTED', 'IN_PROGRESS'].includes(ride.status);
  const isScheduledFuture =
    !!ride.scheduledAt &&
    ride.status === 'REQUESTED' &&
    new Date(ride.scheduledAt).getTime() > Date.now();
  const scheduledLabel = ride.scheduledAt
    ? new Date(ride.scheduledAt).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;
  const displayName =
    role === 'driver' ? ride.passenger.name : ride.driver?.name || 'Finding driver...';
  const vehicleInfo =
    role === 'passenger' && ride.driver?.driverProfile
      ? `${ride.driver.driverProfile.vehicleType} · ${ride.driver.driverProfile.vehicleNumber}`
      : null;

  const routeBlock =
    role === 'driver' ? (
      <div className="relative mb-5 space-y-5 pl-1">
        <div className="absolute bottom-4 left-[7px] top-4 w-px border-l-2 border-dashed border-outline-variant/60" />
        <div className="flex items-start gap-3">
          <div className="relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full bg-primary ring-4 ring-primary/15" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
              Pickup
            </p>
            <p className="text-sm font-medium text-on-surface">{ride.pickupLocation}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-tertiary bg-white/40 ring-4 ring-tertiary/10" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
              Destination
            </p>
            <p className="text-sm font-medium text-on-surface">{ride.destinationLocation}</p>
          </div>
        </div>
      </div>
    ) : (
      <div className="mb-5 space-y-2 rounded-2xl border border-white/30 bg-white/20 p-4">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-sm">{ride.pickupLocation}</span>
        </div>
        <div className="ml-2 h-px w-8 bg-outline-variant/40" />
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-tertiary" />
          <span className="text-sm">{ride.destinationLocation}</span>
        </div>
      </div>
    );

  const content = (
    <>
      {role === 'passenger' && isLive && ride.driver ? (
        <div className="mb-5 flex items-center gap-4 rounded-2xl border border-white/35 bg-white/25 p-4">
          <UserAvatar name={displayName} size="lg" ring />
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl text-on-surface">{displayName}</p>
            {vehicleInfo && (
              <p className="text-xs text-on-surface-variant">{vehicleInfo}</p>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-tertiary-container/25 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-tertiary">
            <span className="h-2 w-2 rounded-full bg-tertiary live-pulse-tertiary" />
            Live
          </span>
        </div>
      ) : (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary live-pulse" />
            )}
            <div>
              <p className="font-semibold text-on-surface">{displayName}</p>
              <p className="text-xs text-on-surface-variant">
                {new Date(ride.requestedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <StatusChip status={ride.status} />
        </div>
      )}

      {isScheduledFuture && scheduledLabel && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-primary/30 bg-primary-fixed/25 px-3 py-2.5 text-xs text-on-surface">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            <span className="font-semibold">Scheduled for {scheduledLabel}</span>
            {role === 'passenger'
              ? '. Drivers will be notified when it is time.'
              : '. Passenger booked this slot in advance.'}
          </p>
        </div>
      )}

      {ride.scheduledAt && !isScheduledFuture && ride.status === 'REQUESTED' && scheduledLabel && (
        <div className="mb-4 rounded-2xl border border-white/30 bg-white/20 px-3 py-2 text-[11px] text-on-surface-variant">
          Originally scheduled: {scheduledLabel}
        </div>
      )}

      {isLive && (
        <div className="mb-5">
          <StatusStepper status={ride.status} />
        </div>
      )}

      {routeBlock}

      <div className="flex flex-wrap gap-3">
        {role === 'driver' && ride.status === 'REQUESTED' && (
          <>
            <Button variant="ghost" onClick={onReject} disabled={loading} className="flex-1">
              Decline
            </Button>
            <Button onClick={onAccept} disabled={loading} className="flex-[2]">
              Accept Ride
            </Button>
          </>
        )}
        {role === 'driver' && ride.status === 'ACCEPTED' && (
          <Button onClick={onStart} disabled={loading} className="w-full">
            Start Ride
          </Button>
        )}
        {role === 'driver' && ride.status === 'IN_PROGRESS' && (
          <Button onClick={onComplete} disabled={loading} className="w-full">
            Complete Ride
          </Button>
        )}
        {['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'].includes(ride.status) && onCancel && (
          <Button variant="danger" onClick={onCancel} disabled={loading} className="w-full">
            Cancel
          </Button>
        )}
      </div>
    </>
  );

  if (embedded) {
    return <div className="page-enter">{content}</div>;
  }

  return <Card variant={isLive ? 'live' : 'deep'}>{content}</Card>;
}
