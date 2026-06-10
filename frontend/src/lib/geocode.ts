const NOMINATIM_HEADERS = {
  'Accept-Language': 'en',
  'User-Agent': 'CampusRide/1.0',
};

export interface GeocodeResult {
  lat: number;
  lng: number;
  name: string;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: NOMINATIM_HEADERS }
    );
    const data = await res.json();
    return (
      data.display_name?.split(',').slice(0, 2).join(', ') ??
      `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    );
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export async function forwardGeocode(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  try {
    const params = new URLSearchParams({
      q: trimmed,
      format: 'json',
      limit: '5',
      viewbox: '77.85,29.90,77.95,29.83',
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: NOMINATIM_HEADERS,
    });
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: { lat: string; lon: string; display_name: string }) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      name: item.display_name.split(',').slice(0, 2).join(', '),
    }));
  } catch {
    return [];
  }
}
