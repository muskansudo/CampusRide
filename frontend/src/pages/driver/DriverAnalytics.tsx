import { useEffect, useState } from 'react';
import { AlertCircle, BarChart2, Car, MapPin, Star, TrendingUp } from 'lucide-react';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { api } from '@/lib/api';
import { useToastStore } from '@/store/toastStore';
import type { DriverAnalytics as AnalyticsData } from '@/types';
import { Card } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { Divider } from '@/components/ui/Divider';
import { getCancelledByLabel } from '@/lib/rideUtils';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    day: d.getDate(),
    month: d.toLocaleString('en', { month: 'short' }),
  };
}

function HourBar({ hour, count, max }: { hour: number; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  const heightPx = Math.max(4, Math.round((pct / 100) * 80));
  const label =
    hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`;

  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span className="text-[9px] text-on-surface-variant">{count > 0 ? count : ''}</span>
      <div className="flex w-full items-end justify-center" style={{ height: 80 }}>
        <div
          className="w-full max-w-[20px] rounded-t-sm bg-tertiary/50 transition-all hover:bg-tertiary/70"
          style={{ height: heightPx }}
        />
      </div>
      <span className="text-[9px] font-medium text-on-surface-variant">{label}</span>
    </div>
  );
}

function DayBar({ date, count, max }: { date: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  const heightPx = Math.max(4, Math.round((pct / 100) * 80));
  const label = new Date(date).toLocaleDateString('en', { weekday: 'short' });

  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span className="text-[9px] text-on-surface-variant">{count > 0 ? count : ''}</span>
      <div className="flex w-full items-end justify-center" style={{ height: 80 }}>
        <div
          className="w-full max-w-[28px] rounded-t-sm bg-primary/50 transition-all hover:bg-primary/70"
          style={{ height: heightPx }}
        />
      </div>
      <span className="text-[9px] font-medium text-on-surface-variant">{label}</span>
    </div>
  );
}

export function DriverAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const load = async () => {
    const data = await api.getDriverAnalytics();
    setAnalytics(data);
  };

  useEffect(() => {
    load()
      .catch(() => addToast('error', 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } catch {
      addToast('error', 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const maxDayCount = analytics
    ? Math.max(...analytics.dailyRides.map((d) => d.count), 1)
    : 1;

  const peakHours = analytics?.peakHours ?? [];
  const maxHourCount = peakHours.length > 0 ? Math.max(...peakHours.map((h) => h.count), 1) : 1;
  const allHours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: peakHours.find((h) => h.hour === hour)?.count ?? 0,
  }));

  if (loading || !analytics) {
    return (
      <Card>
        <p className="text-sm">Loading analytics…</p>
      </Card>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
            Performance
          </p>
          <h2 className="font-display text-3xl text-on-surface">Analytics</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Your driving stats</p>
        </div>
        <RefreshButton onClick={onRefresh} refreshing={refreshing} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card variant="deep" className="col-span-2 !p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
                Total Completed
              </p>
              <p className="font-display text-5xl text-primary-container">
                {analytics.totalRidesCompleted}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed/40">
              <Car className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="!p-4 text-center">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container/30">
            <TrendingUp className="h-4 w-4 text-on-secondary-container" />
          </div>
          <p className="font-display text-2xl text-primary">{analytics.ridesThisWeek}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
            This Week
          </p>
        </Card>

        <Card className="!p-4 text-center">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-tertiary-fixed/30">
            <Star className="h-4 w-4 fill-tertiary text-tertiary" />
          </div>
          <p className="font-display text-2xl text-primary">
            {analytics.averageRating || '—'}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
            Avg · {analytics.totalRatings}
          </p>
        </Card>

        <Card className="!p-4 text-center">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-fixed/20">
            <BarChart2 className="h-4 w-4 text-primary" />
          </div>
          <p className="font-display text-2xl text-primary">
            {analytics.completionRate > 0 ? `${Math.round(analytics.completionRate)}%` : '—'}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
            Completion
          </p>
        </Card>

        <Card className="!p-4 text-center">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-400" />
          </div>
          <p className="font-display text-2xl text-primary">{analytics.totalCancelled}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
            Cancelled
          </p>
        </Card>
      </div>

      {/* 7-day bar chart */}
      <div className="mt-6">
        <Card>
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
            Rides — Last 7 Days
          </p>
          {analytics.dailyRides.every((d) => d.count === 0) ? (
            <div className="flex h-24 items-center justify-center">
              <p className="text-xs text-on-surface-variant">No rides this week</p>
            </div>
          ) : (
            <div className="flex gap-1">
              {analytics.dailyRides.map((d) => (
                <DayBar key={d.date} date={d.date} count={d.count} max={maxDayCount} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Peak hours — campus-wide demand */}
      <div className="mt-6">
        <Card>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
            Campus peak demand hours
          </p>
          <p className="mb-4 text-xs text-on-surface-variant">
            Based on all ride requests across CampusRide
            {(analytics.campusDemandRideCount ?? 0) > 0 &&
              ` · ${analytics.campusDemandRideCount} rides`}
          </p>
          {peakHours.length === 0 ? (
            <div className="flex h-24 items-center justify-center">
              <p className="text-xs text-on-surface-variant">No campus ride data yet</p>
            </div>
          ) : (
            <>
              <div className="flex gap-0.5 overflow-x-auto pb-1">
                {allHours.map((h) => (
                  <HourBar key={h.hour} hour={h.hour} count={h.count} max={maxHourCount} />
                ))}
              </div>
              <p className="mt-3 text-xs text-on-surface-variant">
                Campus busiest:{' '}
                <span className="font-semibold text-on-surface">
                  {peakHours[0].hour === 0
                    ? '12 AM'
                    : peakHours[0].hour < 12
                      ? `${peakHours[0].hour} AM`
                      : peakHours[0].hour === 12
                        ? '12 PM'
                        : `${peakHours[0].hour - 12} PM`}
                </span>{' '}
                ({peakHours[0].count} ride{peakHours[0].count !== 1 ? 's' : ''})
              </p>
            </>
          )}
        </Card>
      </div>

      {/* Hotspots */}
      {((analytics.pickupHotspots?.length ?? 0) > 0 ||
        (analytics.destinationHotspots?.length ?? 0) > 0) && (
        <div className="mt-6 grid gap-3">
          {(analytics.pickupHotspots?.length ?? 0) > 0 && (
            <Card>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
                Campus pickup hotspots
              </p>
              <ul className="space-y-2">
                {analytics.pickupHotspots!.map((spot, i) => (
                  <li
                    key={spot.location}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate text-on-surface">
                      {i + 1}. {spot.location}
                    </span>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {spot.count}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {(analytics.destinationHotspots?.length ?? 0) > 0 && (
            <Card>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
                Campus destination hotspots
              </p>
              <ul className="space-y-2">
                {analytics.destinationHotspots!.map((spot, i) => (
                  <li
                    key={spot.location}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate text-on-surface">
                      {i + 1}. {spot.location}
                    </span>
                    <span className="shrink-0 rounded-full bg-tertiary/10 px-2 py-0.5 text-[10px] font-bold text-tertiary">
                      {spot.count}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* Activity table */}
      {analytics.activityLog.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
            Recent Activity
          </p>
          <Card noPadding>
            {analytics.activityLog.map((ride, i) => {
              const { day, month } = formatDate(ride.date);
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
                      <p className="text-sm font-semibold text-on-surface">{ride.passengerName}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-on-surface-variant">
                        <MapPin className="h-3 w-3 shrink-0 text-primary" />
                        <span className="truncate">{ride.pickupLocation}</span>
                        <span className="text-outline">→</span>
                        <span className="truncate">{ride.destinationLocation}</span>
                      </div>
                      {cancelledByLabel && (
                        <p className="mt-1 text-[11px] font-semibold text-error">
                          {cancelledByLabel}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusChip status={ride.status} />
                      {ride.rating !== null && (
                        <span className="text-[10px] font-semibold text-on-surface-variant">
                          {ride.rating}/5 ★
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* Ratings received */}
      {analytics.recentRatings.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
            Ratings Received
          </p>
          <Card noPadding>
            {analytics.recentRatings.map((r, i) => (
              <div key={r.id}>
                {i > 0 && <Divider />}
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold">{r.passenger.name}</span>
                      <p className="mt-0.5 text-xs text-on-surface-variant">
                        {r.ride.pickupLocation} → {r.ride.destinationLocation}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary-fixed/50 px-2.5 py-1 text-xs font-semibold text-primary">
                      {r.rating}/5 ★
                    </span>
                  </div>
                  {r.feedback && (
                    <p className="mt-2 text-xs text-on-surface-variant">{r.feedback}</p>
                  )}
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Full history */}
      {analytics.fullHistory.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
            Full History
          </p>
          <Card noPadding>
            {analytics.fullHistory.map((ride, i) => {
              const { day, month } = formatDate(ride.requestedAt);
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
                        {ride.passenger.name}
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
        </div>
      )}

      {analytics.fullHistory.length === 0 && analytics.activityLog.length === 0 && (
        <Card variant="deep" className="mt-6 py-10 text-center">
          <h3 className="font-display text-2xl">No rides yet</h3>
          <p className="mt-2 text-xs text-on-surface-variant">
            Completed rides will appear here.
          </p>
        </Card>
      )}
    </div>
  );
}
