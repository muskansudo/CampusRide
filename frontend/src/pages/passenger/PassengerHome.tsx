import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useToastStore } from '@/store/toastStore';
import type { AvailableDriver, Ride } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { RideCard } from '@/components/ride/RideCard';
import { RateRideModal } from '@/components/ride/RateRideModal';
import { MapView, type MapMarker } from '@/components/ui/MapView';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Divider } from '@/components/ui/Divider';

const DEFAULT_CENTER: [number, number] = [29.8659, 77.8974]; // IIT Roorkee campus

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'CampusRide/1.0' } }
    );
    const data = await res.json();
    return data.display_name?.split(',').slice(0, 2).join(', ') ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

type LocationMode = 'pickup' | 'destination' | null;

export function PassengerHome() {
  const [drivers, setDrivers] = useState<AvailableDriver[]>([]);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [locationMode, setLocationMode] = useState<LocationMode>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rateRide, setRateRide] = useState<Ride | null>(null);
  const geocodingRef = useRef(false);
  const addToast = useToastStore((s) => s.addToast);

  const isLive = activeRide && ['ACCEPTED', 'IN_PROGRESS'].includes(activeRide.status);

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
        if (ride.status === 'COMPLETED') setRateRide(ride);
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

  const handleMapClick = async (lat: number, lng: number) => {
    if (!locationMode || geocodingRef.current) return;
    geocodingRef.current = true;
    const placeName = await reverseGeocode(lat, lng);
    geocodingRef.current = false;

    if (locationMode === 'pickup') {
      setPickup(placeName);
      setPickupCoords([lat, lng]);
      setLocationMode('destination');
    } else {
      setDestination(placeName);
      setDestCoords([lat, lng]);
      setLocationMode(null);
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ride = await api.createRide({
        pickupLocation: pickup,
        destinationLocation: destination,
        ...(pickupCoords && { pickupLat: pickupCoords[0], pickupLng: pickupCoords[1] }),
        ...(destCoords && { destLat: destCoords[0], destLng: destCoords[1] }),
      });
      setActiveRide(ride);
      setPickup('');
      setDestination('');
      setPickupCoords(null);
      setDestCoords(null);
      setLocationMode(null);
      addToast('success', 'Ride requested!');
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
      const ride = await api.cancelRide(activeRide.id);
      setActiveRide(ride);
      setDriverLocation(null);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to cancel');
    } finally {
      setLoading(false);
    }
  };

  // Build map markers
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
    driverLocation && isLive
      ? driverLocation
      : pickupCoords ?? DEFAULT_CENTER;

  return (
    <div className="relative -mx-6 -mt-6 min-h-[calc(100dvh-10rem)]">
      {/* Map */}
      <div className="relative h-[55vh]">
        <MapView
          center={mapCenter}
          markers={markers}
          onMapClick={!activeRide ? handleMapClick : undefined}
          className="h-full w-full"
        />

        {/* Location mode hint */}
        {locationMode && (
          <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2">
            <div className="rounded-full bg-surface-container/90 px-4 py-2 text-xs font-semibold text-on-surface shadow backdrop-blur-sm">
              {locationMode === 'pickup' ? '📍 Tap map to set pickup' : '🏁 Tap map to set destination'}
            </div>
          </div>
        )}

        {/* Refresh button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full glass text-primary shadow transition hover:bg-white/50 disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw className={['h-4 w-4', refreshing ? 'animate-spin' : ''].join(' ')} />
        </button>
      </div>

      {/* Bottom sheet */}
      <div className="absolute inset-x-0 bottom-0">
        <BottomSheet>
          {activeRide ? (
            <RideCard
              ride={activeRide}
              role="passenger"
              embedded
              onCancel={handleCancel}
              loading={loading}
            />
          ) : (
            <>
              <h2 className="font-display text-3xl leading-tight text-on-surface">
                Where are you{' '}
                <span className="italic text-primary">going?</span>
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {drivers.length} driver{drivers.length !== 1 ? 's' : ''} available nearby
              </p>

              <form onSubmit={handleRequest} className="mt-6 space-y-3">
                <div
                  className="cursor-pointer"
                  onClick={() => setLocationMode('pickup')}
                >
                  <Input
                    label="Pickup Location"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="Tap map or type location"
                    icon={<Navigation className="h-5 w-5" />}
                    className={locationMode === 'pickup' ? 'border-primary/60 ring-2 ring-primary/20' : ''}
                  />
                </div>
                <div
                  className="cursor-pointer"
                  onClick={() => setLocationMode('destination')}
                >
                  <Input
                    label="Destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Tap map or type location"
                    icon={<MapPin className="h-5 w-5" />}
                    className={locationMode === 'destination' ? 'border-primary/60 ring-2 ring-primary/20' : ''}
                  />
                </div>
                <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
                  Request Ride
                </Button>
              </form>

              {drivers.length > 0 && (
                <div className="mt-8">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
                    Online Drivers
                  </p>
                  <div className="space-y-0 rounded-2xl border border-white/30 bg-white/20">
                    {drivers.map((d, i) => (
                      <div key={d.id}>
                        {i > 0 && <Divider />}
                        <div className="flex items-center gap-3 px-4 py-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-container/30 bg-primary-fixed/30 text-sm font-semibold text-primary">
                            {d.user.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{d.user.name}</p>
                            <p className="text-xs text-on-surface-variant">
                              {d.vehicleType} · {d.vehicleNumber}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary-container/15 px-2 py-1 text-[9px] font-bold uppercase text-primary">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary live-pulse" />
                            Online
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </BottomSheet>
      </div>

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
