import { useEffect, useState } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import type { Ride } from '@/types';
import { Card } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { Divider } from '@/components/ui/Divider';

function formatRideDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    day: d.getDate(),
    month: d.toLocaleString('en', { month: 'short' }),
  };
}

export function PassengerHistory() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const data = await api.getRideHistory();
    setRides(data);
  };

  useEffect(() => {
    load().catch(console.error).finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-on-surface">Ride History</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Your past campus rides</p>
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

      {loading ? (
        <Card>
          <p className="text-sm">Loading…</p>
        </Card>
      ) : rides.length === 0 ? (
        <Card variant="deep" className="py-10 text-center">
          <h3 className="font-display text-2xl">No rides yet</h3>
          <p className="mt-2 text-xs text-on-surface-variant">
            Your journey history will appear here.
          </p>
        </Card>
      ) : (
        <Card noPadding>
          {rides.map((ride, i) => {
            const { day, month } = formatRideDate(ride.requestedAt);
            return (
              <div key={ride.id}>
                {i > 0 && <Divider />}
                <div className="flex gap-4 p-5">
                  <div className="w-11 shrink-0 text-center">
                    <p className="font-display text-xl leading-none text-primary">{day}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
                      {month}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-sm">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate">{ride.pickupLocation}</span>
                      <span className="text-xs text-outline">→</span>
                      <span className="truncate">{ride.destinationLocation}</span>
                    </div>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {ride.driver?.name || 'No driver'}
                      {ride.rating && ` · ${ride.rating.rating}/5 ★`}
                    </p>
                  </div>
                  <StatusChip status={ride.status} />
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
