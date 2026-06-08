import { useEffect, useState } from 'react';
import { AlertCircle, BarChart2, Car, MapPin, RefreshCw, Star, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { useToastStore } from '@/store/toastStore';
import type { DriverAnalytics as AnalyticsData } from '@/types';
import { Card } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { Divider } from '@/components/ui/Divider';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    day: d.getDate(),
    month: d.toLocaleString('en', { month: 'short' }),
  };
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

      {/* Activity table */}
      {analytics.activityLog.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
            Recent Activity
          </p>
          <Card noPadding>
            {analytics.activityLog.map((ride, i) => {
              const { day, month } = formatDate(ride.date);
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
                    </div>
                    <StatusChip status={ride.status} />
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
