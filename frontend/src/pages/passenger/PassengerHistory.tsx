import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { api } from '@/lib/api';
import type { Ride } from '@/types';
import { Card } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { Divider } from '@/components/ui/Divider';
import { getCancelledByLabel } from '@/lib/rideUtils';

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
        <RefreshButton onClick={onRefresh} refreshing={refreshing} />
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
            const cancelledByLabel = getCancelledByLabel(ride);
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
                    {cancelledByLabel && (
                      <p className="mt-1 text-[11px] font-semibold text-error">
                        {cancelledByLabel}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusChip status={ride.status} />
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
