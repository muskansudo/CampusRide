export type LatLng = [number, number];

/** Fetch a driving route between two points; falls back to a straight line. */
export async function fetchDrivingRoute(from: LatLng, to: LatLng): Promise<LatLng[]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) {
      return [from, to];
    }
    return coords.map(([lng, lat]: [number, number]) => [lat, lng] as LatLng);
  } catch {
    return [from, to];
  }
}

export function rideEndpoints(ride: {
  pickupLat: number | null;
  pickupLng: number | null;
  destLat: number | null;
  destLng: number | null;
}): { pickup: LatLng; destination: LatLng } | null {
  if (
    ride.pickupLat == null ||
    ride.pickupLng == null ||
    ride.destLat == null ||
    ride.destLng == null
  ) {
    return null;
  }
  return {
    pickup: [ride.pickupLat, ride.pickupLng],
    destination: [ride.destLat, ride.destLng],
  };
}
