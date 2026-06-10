import { useEffect, useState } from 'react';
import { fetchDrivingRoute, type LatLng } from '@/lib/route';

export function useRideRoute(
  pickup: LatLng | null,
  destination: LatLng | null,
  enabled: boolean
): LatLng[] | undefined {
  const [route, setRoute] = useState<LatLng[] | undefined>(undefined);

  useEffect(() => {
    if (!enabled || !pickup || !destination) {
      setRoute(undefined);
      return;
    }

    let cancelled = false;
    setRoute(undefined);
    fetchDrivingRoute(pickup, destination).then((path) => {
      if (!cancelled) setRoute(path);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, pickup?.[0], pickup?.[1], destination?.[0], destination?.[1]]);

  return route;
}
