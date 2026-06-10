
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, MapPin, Navigation, Users } from 'lucide-react';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useToastStore } from '@/store/toastStore';
import type { AvailableDriver, Payment, Ride } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { RideCard } from '@/components/ride/RideCard';
import { RateRideModal } from '@/components/ride/RateRideModal';
import { PaymentModal } from '@/components/ride/PaymentModal';
import { MapView, type MapMarker } from '@/components/ui/MapView';
import { Card } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Divider';
import { forwardGeocode, reverseGeocode, type GeocodeResult } from '@/lib/geocode';
import { rideEndpoints } from '@/lib/route';
import { useRideRoute } from '@/hooks/useRideRoute';
import {
  addRecentLocation,
  getQuickPickLocations,
  getSavedLocations,
  toggleSavedLocation,
  type StoredLocation,
} from '@/lib/savedLocations';
import { SavedLocationChips } from '@/components/passenger/SavedLocationChips';

const DEFAULT_CENTER: [number, number] = [29.8659, 77.8974];

function getMinScheduleValue() {
  const d = new Date(Date.now() + 15 * 60 * 1000);
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatScheduledAt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

type LocationMode = 'pickup' | 'destination' | null;

const STEPS = [
  { id: 'pickup', label: 'Pickup', hint: 'Search, type, or click the map' },
  { id: 'destination', label: 'Destination', hint: 'Where you want to go' },
  { id: 'request', label: 'Request', hint: 'Confirm and wait for a driver' },
] as const;

export function PassengerHome() {
  const [drivers, setDrivers] = useState<AvailableDriver[]>([]);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [locationMode, setLocationMode] = useState<LocationMode>('pickup');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{ payment: Payment; ride: Ride } | null>(null);
  const [rateRide, setRateRide] = useState<Ride | null>(null);
  const [pickupSuggestions, setPickupSuggestions] = useState<GeocodeResult[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<GeocodeResult[]>([]);
  const [scheduleForLater, setScheduleForLater] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [locationsVersion, setLocationsVersion] = useState(0);
  const geocodingRef = useRef(false);
  const locationModeRef = useRef(locationMode);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addToast = useToastStore((s) => s.addToast);

  locationModeRef.current = locationMode;

  const quickLocations = useMemo(() => getQuickPickLocations(), [locationsVersion]);
  const savedIds = useMemo(
    () => new Set(getSavedLocations().map((loc) => loc.id)),
    [locationsVersion]
  );

  const isScheduledWaiting =
    !!activeRide?.scheduledAt &&
    activeRide.status === 'REQUESTED' &&
    new Date(activeRide.scheduledAt).getTime() > Date.now();

  const isLive =
    activeRide && ['ACCEPTED', 'IN_PROGRESS'].includes(activeRide.status);
  const isInProgress = activeRide?.status === 'IN_PROGRESS';
  const rideRouteEndpoints = activeRide ? rideEndpoints(activeRide) : null;
  const routePath = useRideRoute(
    rideRouteEndpoints?.pickup ?? null,
    rideRouteEndpoints?.destination ?? null,
    !!isInProgress
  );

  const currentStep =
    !pickup.trim() || !pickupCoords
      ? 0
      : !destination.trim() || !destCoords
        ? 1
        : 2;

  const loadData = useCallback(async () => {
    const [driversData, ride] = await Promise.all([
      api.getAvailableDrivers(),
      api.getActiveRide(),
    ]);
    setDrivers(driversData);
    setActiveRide(ride);
  }, []);

  useEffect(() => {
    loadData().catch(console.error);
  }, [loadData]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onRideUpdate = (ride: Ride) => {
      if (ride.passengerId) {
        setActiveRide(ride);
        if (ride.status === 'COMPLETED') {
          if (ride.payment && ride.payment.status === 'PENDING') {
            setPendingPayment({ payment: ride.payment, ride });
          } else {
            setRateRide(ride);
          }
        }
        if (ride.status === 'CANCELLED') setDriverLocation(null);
      }
    };

    const onDriverLocation = (data: { lat: number; lng: number }) => {
      setDriverLocation([data.lat, data.lng]);
    };

    socket.on('ride:accepted', onRideUpdate);
    socket.on('ride:status:update', onRideUpdate);
    socket.on('ride:cancelled', onRideUpdate);
    socket.on('driver:location', onDriverLocation);

    return () => {
      socket.off('ride:accepted', onRideUpdate);
      socket.off('ride:status:update', onRideUpdate);
      socket.off('ride:cancelled', onRideUpdate);
      socket.off('driver:location', onDriverLocation);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  const searchLocation = (query: string, field: 'pickup' | 'destination') => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (query.trim().length < 3) {
      if (field === 'pickup') setPickupSuggestions([]);
      else setDestSuggestions([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      const results = await forwardGeocode(query);
      if (field === 'pickup') setPickupSuggestions(results);
      else setDestSuggestions(results);
    }, 400);
  };

  const rememberLocation = (name: string, lat?: number, lng?: number) => {
    addRecentLocation({ name, lat, lng });
    setLocationsVersion((v) => v + 1);
  };

  const selectSuggestion = (result: GeocodeResult, field: 'pickup' | 'destination') => {
    if (field === 'pickup') {
      setPickup(result.name);
      setPickupCoords([result.lat, result.lng]);
      setPickupSuggestions([]);
      setLocationMode('destination');
      rememberLocation(result.name, result.lat, result.lng);
    } else {
      setDestination(result.name);
      setDestCoords([result.lat, result.lng]);
      setDestSuggestions([]);
      rememberLocation(result.name, result.lat, result.lng);
    }
  };

  const applyQuickLocation = (loc: StoredLocation, field: 'pickup' | 'destination') => {
    if (field === 'pickup') {
      setPickup(loc.name);
      setPickupCoords(loc.lat != null && loc.lng != null ? [loc.lat, loc.lng] : null);
      setLocationMode('destination');
    } else {
      setDestination(loc.name);
      setDestCoords(loc.lat != null && loc.lng != null ? [loc.lat, loc.lng] : null);
    }
  };

  const handleToggleSave = (loc: StoredLocation) => {
    toggleSavedLocation({
      name: loc.name,
      lat: loc.lat,
      lng: loc.lng,
    });
    setLocationsVersion((v) => v + 1);
  };

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    const mode = locationModeRef.current;
    if (!mode || geocodingRef.current || activeRide) return;
    geocodingRef.current = true;
    try {
      const placeName = await reverseGeocode(lat, lng);
      if (mode === 'pickup') {
        setPickup(placeName);
        setPickupCoords([lat, lng]);
        setLocationMode('destination');
        rememberLocation(placeName, lat, lng);
      } else if (mode === 'destination') {
        setDestination(placeName);
        setDestCoords([lat, lng]);
        rememberLocation(placeName, lat, lng);
      }
    } finally {
      geocodingRef.current = false;
    }
  }, [activeRide]);

  const resolveTypedLocation = async (field: 'pickup' | 'destination') => {
    const query = field === 'pickup' ? pickup : destination;
    const hasCoords = field === 'pickup' ? pickupCoords : destCoords;
    if (!query.trim() || hasCoords) return;

    const results = await forwardGeocode(query);
    if (results[0]) {
      selectSuggestion(results[0], field);
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup.trim() || !destination.trim()) {
      addToast('error', 'Set both pickup and destination');
      return;
    }
    if (scheduleForLater && !scheduledAt) {
      addToast('error', 'Choose a date and time for your scheduled ride');
      return;
    }
    setLoading(true);
    try {
      const ride = await api.createRide({
        pickupLocation: pickup,
        destinationLocation: destination,
        ...(pickupCoords && { pickupLat: pickupCoords[0], pickupLng: pickupCoords[1] }),
        ...(destCoords && { destLat: destCoords[0], destLng: destCoords[1] }),
        ...(scheduleForLater &&
          scheduledAt && { scheduledAt: new Date(scheduledAt).toISOString() }),
      });
      setActiveRide(ride);
      setPickup('');
      setDestination('');
      setPickupCoords(null);
      setDestCoords(null);
      setScheduleForLater(false);
      setScheduledAt('');
      setLocationMode('pickup');
      addToast(
        'success',
        ride.scheduledAt
          ? `Ride scheduled for ${formatScheduledAt(ride.scheduledAt)}`
          : 'Ride requested — waiting for a driver'
      );
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to request ride');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!activeRide) return;
    setLoading(true);
    try {
      await api.cancelRide(activeRide.id);
      setActiveRide(null);
      setDriverLocation(null);
      addToast('info', 'Ride cancelled');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to cancel');
    } finally {
      setLoading(false);
    }
  };

  const markers: MapMarker[] = [];
  if (activeRide) {
    if (activeRide.pickupLat && activeRide.pickupLng) {
      markers.push({ position: [activeRide.pickupLat, activeRide.pickupLng], type: 'pickup', label: 'Pickup' });
    }
    if (activeRide.destLat && activeRide.destLng) {
      markers.push({ position: [activeRide.destLat, activeRide.destLng], type: 'destination', label: 'Destination' });
    }
  } else {
    if (pickupCoords) markers.push({ position: pickupCoords, type: 'pickup', label: pickup });
    if (destCoords) markers.push({ position: destCoords, type: 'destination', label: destination });
  }
  if (driverLocation && isLive) {
    markers.push({ position: driverLocation, type: 'driver', label: 'Driver' });
  }

  const mapCenter: [number, number] =
    driverLocation && isLive ? driverLocation : pickupCoords ?? DEFAULT_CENTER;

  return (
    <div className="-mx-6 -mt-6 flex flex-col">
      <div className="relative h-[42vh] min-h-[220px] shrink-0">
        <MapView
          center={mapCenter}
          markers={markers}
          route={routePath}
          onMapClick={!activeRide ? handleMapClick : undefined}
          className="absolute inset-0 h-full w-full"
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/25 to-transparent px-6 py-4">
          <p className="text-sm font-semibold text-white drop-shadow">Campus map</p>
          <p className="text-xs text-white/90 drop-shadow">
            {activeRide
              ? isScheduledWaiting
                ? `Scheduled — drivers notified at pickup time`
              : isInProgress
                ? 'Route to destination'
                : 'Tracking your ride'
              : locationMode === 'pickup'
                ? 'Click the map to set pickup'
                : locationMode === 'destination'
                  ? 'Click the map to set destination'
                  : 'Pick a field below, then tap the map'}
          </p>
        </div>

        {locationMode && !activeRide && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
            <div className="rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-on-surface shadow-lg">
              {locationMode === 'pickup' ? '📍 Setting pickup' : '🏁 Setting destination'}
            </div>
          </div>
        )}

        <RefreshButton
          onClick={onRefresh}
          refreshing={refreshing}
          variant="map"
          className="absolute right-4 top-4 z-10"
        />
      </div>

      <div className="flex flex-col gap-4 px-6 pt-5">
        {activeRide ? (
          <Card variant={isLive ? 'live' : 'deep'}>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
              Your active ride
            </p>
            <RideCard
              ride={activeRide}
              role="passenger"
              embedded
              onCancel={handleCancel}
              loading={loading}
            />
          </Card>
        ) : (
          <>
            <Card variant="deep">
              <h2 className="font-display text-2xl text-on-surface">Request a ride</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Set where you are and where you&apos;re going. A nearby driver can accept your request.
              </p>

              <ol className="mt-5 space-y-2">
                {STEPS.map((step, i) => {
                  const active = i === currentStep;
                  const done = i < currentStep;
                  return (
                    <li
                      key={step.id}
                      className={[
                        'flex gap-3 rounded-2xl border px-3 py-2.5 transition',
                        active ? 'border-primary/40 bg-primary-fixed/25' : 'border-transparent bg-white/20',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                          done ? 'bg-primary text-on-primary' : active ? 'bg-primary/20 text-primary' : 'bg-white/40 text-outline',
                        ].join(' ')}
                      >
                        {done ? '✓' : i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{step.label}</p>
                        <p className="text-xs text-on-surface-variant">{step.hint}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {quickLocations.length > 0 && (
                <div className="mt-4">
                  <SavedLocationChips
                    locations={quickLocations}
                    savedIds={savedIds}
                    onSelect={(loc) =>
                      applyQuickLocation(loc, locationMode === 'destination' ? 'destination' : 'pickup')
                    }
                    onToggleSave={handleToggleSave}
                  />
                </div>
              )}

              <form onSubmit={handleRequest} className="mt-5 space-y-3">
                <div className="relative">
                  <Input
                    label="Pickup"
                    value={pickup}
                    onFocus={() => setLocationMode('pickup')}
                    onChange={(e) => {
                      setPickup(e.target.value);
                      setPickupCoords(null);
                      searchLocation(e.target.value, 'pickup');
                    }}
                    onBlur={() => resolveTypedLocation('pickup')}
                    placeholder="e.g. Main Gate, IIT Roorkee"
                    icon={<Navigation className="h-5 w-5" />}
                    className={locationMode === 'pickup' ? 'border-primary/60 ring-2 ring-primary/20' : ''}
                  />
                  {pickupSuggestions.length > 0 && (
                    <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-white/30 bg-surface-container shadow-lg">
                      {pickupSuggestions.map((s) => (
                        <li key={`${s.lat}-${s.lng}`}>
                          <button
                            type="button"
                            className="w-full px-4 py-3 text-left text-sm hover:bg-white/60"
                            onClick={() => selectSuggestion(s, 'pickup')}
                          >
                            {s.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="relative">
                  <Input
                    label="Destination"
                    value={destination}
                    onFocus={() => setLocationMode('destination')}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      setDestCoords(null);
                      searchLocation(e.target.value, 'destination');
                    }}
                    onBlur={() => resolveTypedLocation('destination')}
                    placeholder="e.g. Library, Lecture Hall"
                    icon={<MapPin className="h-5 w-5" />}
                    className={locationMode === 'destination' ? 'border-primary/60 ring-2 ring-primary/20' : ''}
                  />
                  {destSuggestions.length > 0 && (
                    <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-white/30 bg-surface-container shadow-lg">
                      {destSuggestions.map((s) => (
                        <li key={`${s.lat}-${s.lng}`}>
                          <button
                            type="button"
                            className="w-full px-4 py-3 text-left text-sm hover:bg-white/60"
                            onClick={() => selectSuggestion(s, 'destination')}
                          >
                            {s.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/30 bg-white/20 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={scheduleForLater}
                    onChange={(e) => {
                      setScheduleForLater(e.target.checked);
                      if (e.target.checked && !scheduledAt) {
                        setScheduledAt(getMinScheduleValue());
                      }
                    }}
                    className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                  />
                  <div className="flex items-center gap-2 text-sm font-medium text-on-surface">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    Schedule for later
                  </div>
                </label>

                {scheduleForLater && (
                  <Input
                    label="Pickup time"
                    type="datetime-local"
                    value={scheduledAt}
                    min={getMinScheduleValue()}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                )}

                <Button
                  type="submit"
                  size="lg"
                  loading={loading}
                  className="mt-2 w-full"
                  disabled={!pickup.trim() || !destination.trim()}
                >
                  {scheduleForLater ? 'Schedule Ride' : 'Request Ride'}
                </Button>
              </form>
            </Card>

            <Card>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-on-surface">
                  {drivers.length} driver{drivers.length !== 1 ? 's' : ''} online
                </p>
              </div>
              {drivers.length === 0 ? (
                <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
                  Please wait. No drivers are online yet. 
                </p>
              ) : (
                <div className="mt-3 space-y-0 rounded-2xl border border-white/30 bg-white/20">
                  {drivers.map((d, i) => (
                    <div key={d.id}>
                      {i > 0 && <Divider />}
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed/40 text-sm font-semibold text-primary">
                          {d.user.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{d.user.name}</p>
                          <p className="text-xs text-on-surface-variant">
                            {d.vehicleType} · {d.vehicleNumber}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase text-primary">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary live-pulse" />
                          Online
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>

      {pendingPayment && (
        <PaymentModal
          payment={pendingPayment.payment}
          driverName={pendingPayment.ride.driver?.name ?? 'Driver'}
          driverUpiId={pendingPayment.ride.driver?.driverProfile?.upiId ?? null}
          onClose={(paid) => {
            const ride = pendingPayment.ride;
            setPendingPayment(null);
            if (paid) {
              setRateRide(ride);
            } else {
              setActiveRide(null);
            }
          }}
        />
      )}

      {rateRide && (
        <RateRideModal
          ride={rateRide}
          open
          onClose={() => {
            setRateRide(null);
            setActiveRide(null);
          }}
        />
      )}
    </div>
  );
}
