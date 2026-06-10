import { useCallback, useEffect, useRef, useState } from 'react';
import { Car, Star, TrendingUp } from 'lucide-react';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import type { DriverDashboard as DashboardData } from '@/types';
import { Card } from '@/components/ui/Card';
import { RideCard } from '@/components/ride/RideCard';
import { Divider } from '@/components/ui/Divider';
import { MapView, type MapMarker } from '@/components/ui/MapView';
import { rideEndpoints } from '@/lib/route';
import { useRideRoute } from '@/hooks/useRideRoute';

const DEFAULT_CENTER: [number, number] = [29.8659, 77.8974];

function buildDriverMapMarkers(
  activeRides: DashboardData['activeRides'],
  driverCoords: [number, number] | null
): MapMarker[] {
  const markers: MapMarker[] = [];

  if (driverCoords) {
    markers.push({ position: driverCoords, type: 'driver', label: 'You' });
  }

  for (const ride of activeRides) {
    if (ride.pickupLat != null && ride.pickupLng != null) {
      markers.push({
        position: [ride.pickupLat, ride.pickupLng],
        type: 'pickup',
        label: ride.pickupLocation,
      });
    }
    if (ride.destLat != null && ride.destLng != null) {
      markers.push({
        position: [ride.destLat, ride.destLng],
        type: 'destination',
        label: ride.destinationLocation,
      });
    }
  }

  return markers;
}

export function DriverDashboard() {
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const addToast = useToastStore((s) => s.addToast);
  const isVerified = user?.driverProfile?.verificationStatus === 'VERIFIED';
  const verificationPending =
    user?.driverProfile?.verificationStatus === 'PENDING' &&
    !!user?.driverProfile?.verificationSubmittedAt;
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [driverCoords, setDriverCoords] = useState<[number, number] | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestCoordsRef = useRef<[number, number] | null>(null);

  const loadDashboard = useCallback(async () => {
    const data = await api.getDashboard();
    setDashboard(data);
  }, []);

  useEffect(() => {
    loadDashboard().catch(console.error).finally(() => setLoading(false));
  }, [loadDashboard]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const refresh = () => loadDashboard().catch(console.error);
    socket.on('ride:accepted', refresh);
    socket.on('ride:status:update', refresh);
    socket.on('ride:cancelled', refresh);
    return () => {
      socket.off('ride:accepted', refresh);
      socket.off('ride:status:update', refresh);
      socket.off('ride:cancelled', refresh);
    };
  }, [loadDashboard]);

  // Geolocation: watch position and send to backend every 10s when online
  useEffect(() => {
    if (!dashboard?.isOnline) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setDriverCoords(coords);
        latestCoordsRef.current = coords;
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    locationIntervalRef.current = setInterval(() => {
      const coords = latestCoordsRef.current;
      if (coords) {
        api.updateDriverLocation(coords[0], coords[1]).catch(() => {});
      }
    }, 10000);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  }, [dashboard?.isOnline]);

  const toggleOnline = async () => {
    if (!dashboard) return;
    if (!dashboard.isOnline && !isVerified) {
      addToast(
        'error',
        verificationPending
          ? 'Verification is pending admin approval'
          : 'Complete driver verification on your profile before going online'
      );
      return;
    }
    setActionLoading(true);
    try {
      const newStatus = !dashboard.isOnline;
      await api.updateDriverStatus(newStatus);
      getSocket()?.emit('driver:status', { isOnline: newStatus });
      setDashboard({ ...dashboard, isOnline: newStatus });
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRideAction = async (action: 'start' | 'complete' | 'cancel', rideId: string) => {
    setActionLoading(true);
    try {
      if (action === 'start') await api.startRide(rideId);
      else if (action === 'complete') await api.completeRide(rideId);
      else await api.cancelRide(rideId);
      await loadDashboard();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadDashboard(), refreshUser()]);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const inProgressRide = dashboard?.activeRides.find((r) => r.status === 'IN_PROGRESS');
  const routeEndpoints = inProgressRide ? rideEndpoints(inProgressRide) : null;
  const routePath = useRideRoute(
    routeEndpoints?.pickup ?? null,
    routeEndpoints?.destination ?? null,
    !!inProgressRide
  );

  if (loading || !dashboard) {
    return (
      <Card>
        <p className="text-sm">Loading dashboard…</p>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
            Welcome back
          </p>
          <h2 className="font-display text-3xl text-on-surface">
            {user?.name?.split(' ')[0] || 'Driver'}
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {dashboard.vehicleType} · {dashboard.vehicleNumber}
          </p>
        </div>
        <RefreshButton onClick={onRefresh} refreshing={refreshing} />
      </div>

      {!isVerified && (
        <Card className="mb-4 border-yellow-500/20 bg-yellow-500/10">
          <p className="text-sm font-semibold text-yellow-600">
            {verificationPending ? 'Verification pending' : 'Verification required'}
          </p>
          <p className="mt-1 text-sm text-on-surface-variant">
            {verificationPending
              ? 'An admin is reviewing your documents. You cannot go online until approved.'
              : 'Submit your license and government ID on your profile to go online.'}
          </p>
        </Card>
      )}

      <button
        type="button"
        onClick={toggleOnline}
        disabled={actionLoading || (!dashboard.isOnline && !isVerified)}
        className={[
          'mb-6 flex w-full items-center justify-between rounded-3xl border px-6 py-4 transition disabled:opacity-50',
          dashboard.isOnline ? 'glass-live border-tertiary/30' : 'glass border-glass-border',
        ].join(' ')}
      >
        <div className="flex items-center gap-3">
          {dashboard.isOnline && (
            <span className="h-2.5 w-2.5 rounded-full bg-primary live-pulse" />
          )}
          <div className="text-left">
            <p className="text-sm font-semibold uppercase tracking-wide text-on-surface">
              {dashboard.isOnline ? 'You are Online' : 'Go Online'}
            </p>
            <p className="text-[10px] text-on-surface-variant">
              {dashboard.isOnline ? 'Receiving ride requests' : 'Tap to start accepting rides'}
            </p>
          </div>
        </div>
        <span
          className={[
            'relative h-7 w-14 shrink-0 rounded-full transition',
            dashboard.isOnline ? 'bg-primary-container' : 'bg-surface-container-high',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all',
              dashboard.isOnline ? 'left-8' : 'left-1',
            ].join(' ')}
          />
        </span>
      </button>

      {(dashboard.isOnline || dashboard.activeRides.length > 0) && (
        <div className="mb-6">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
            {inProgressRide ? 'Your route' : dashboard.activeRides.length > 0 ? 'Pickup & destination' : 'Your location'}
          </p>
          <Card noPadding className="overflow-hidden">
            <MapView
              center={driverCoords ?? DEFAULT_CENTER}
              zoom={15}
              markers={buildDriverMapMarkers(dashboard.activeRides, driverCoords)}
              route={routePath}
              className="h-52 w-full"
            />
          </Card>
        </div>
      )}

      {dashboard.activeRides.length > 0 && (
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-2xl">Active Rides</h3>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary-container/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-tertiary">
              <span className="h-2 w-2 rounded-full bg-tertiary live-pulse-tertiary" />
              Live
            </span>
          </div>
          <div className="space-y-4">
            {dashboard.activeRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                role="driver"
                onStart={() => handleRideAction('start', ride.id)}
                onComplete={() => handleRideAction('complete', ride.id)}
                onCancel={() => handleRideAction('cancel', ride.id)}
                loading={actionLoading}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Daily earnings hero card */}
        <Card variant="deep" className="col-span-2 !p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
                Today's Earnings
              </p>
              <p className="font-display text-5xl text-primary-container">
                ₹{dashboard.todayEarnings}
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {dashboard.todayRides} ride{dashboard.todayRides !== 1 ? 's' : ''} completed today
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed/40">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="!p-4 text-center">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container/30">
            <Car className="h-4 w-4 text-on-secondary-container" />
          </div>
          <p className="font-display text-2xl text-primary">{dashboard.totalRidesCompleted}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
            Total
          </p>
        </Card>

        <Card className="!p-4 text-center">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-tertiary-fixed/30">
            <Star className="h-4 w-4 fill-tertiary text-tertiary" />
          </div>
          <p className="font-display text-2xl text-primary">
            {dashboard.averageRating || '—'}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
            Avg · {dashboard.totalRatings}
          </p>
        </Card>
      </div>

      {dashboard.recentRatings.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
            Recent Feedback
          </p>
          <Card noPadding>
            {dashboard.recentRatings.map((r, i) => (
              <div key={r.id}>
                {i > 0 && <Divider />}
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{r.passenger.name}</span>
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
    </div>
  );
}
