import { useCallback, useEffect, useState } from 'react';
import { Inbox, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useToastStore } from '@/store/toastStore';
import type { Ride } from '@/types';
import { Card } from '@/components/ui/Card';
import { RideCard } from '@/components/ride/RideCard';

export function DriverRequests() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const loadRides = useCallback(async () => {
    const data = await api.getPendingRides();
    setRides(data);
  }, []);

  useEffect(() => {
    loadRides().catch(console.error).finally(() => setLoading(false));
  }, [loadRides]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewRide = (ride: Ride) => {
      setRides((prev) => [ride, ...prev.filter((r) => r.id !== ride.id)]);
    };
    const onRemove = (ride: Ride) => {
      setRides((prev) => prev.filter((r) => r.id !== ride.id));
    };

    socket.on('ride:requested', onNewRide);
    socket.on('ride:accepted', onRemove);
    socket.on('ride:cancelled', onRemove);
    return () => {
      socket.off('ride:requested', onNewRide);
      socket.off('ride:accepted', onRemove);
      socket.off('ride:cancelled', onRemove);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadRides();
    } finally {
      setRefreshing(false);
    }
  };

  const handleAccept = async (rideId: string) => {
    setActionLoading(true);
    try {
      await api.acceptRide(rideId);
      setRides((prev) => prev.filter((r) => r.id !== rideId));
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to accept ride');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (rideId: string) => {
    try {
      await api.rejectRide(rideId);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-on-surface">Incoming Requests</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Accept ride requests from passengers
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="flex h-10 w-10 items-center justify-center rounded-full glass text-primary transition hover:bg-white/50 disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw className={['h-4 w-4', refreshing ? 'animate-spin' : ''].join(' ')} />
        </button>
      </div>

      {rides.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-full border border-tertiary/25 bg-tertiary-container/10 px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-tertiary live-pulse-tertiary" />
          <p className="text-xs font-semibold uppercase tracking-wide text-tertiary">
            {rides.length} pending request{rides.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {loading ? (
        <Card>
          <p className="text-sm">Loading…</p>
        </Card>
      ) : rides.length === 0 ? (
        <Card variant="deep" className="py-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container/50">
            <Inbox className="h-7 w-7 text-outline" />
          </div>
          <h3 className="font-display text-xl">No pending requests</h3>
          <p className="mt-2 text-xs text-on-surface-variant">
            Go online from your dashboard to receive rides.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => (
            <RideCard
              key={ride.id}
              ride={ride}
              role="driver"
              onAccept={() => handleAccept(ride.id)}
              onReject={() => handleReject(ride.id)}
              loading={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
