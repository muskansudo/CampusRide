export interface StoredLocation {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
}

const RECENT_KEY = 'campusride_recent_locations';
const SAVED_KEY = 'campusride_saved_locations';
const MAX_RECENT = 8;
const MAX_SAVED = 10;

function read(key: string): StoredLocation[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as StoredLocation[]) : [];
  } catch {
    return [];
  }
}

function write(key: string, items: StoredLocation[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

function locationKey(loc: Pick<StoredLocation, 'name' | 'lat' | 'lng'>) {
  return `${loc.name}|${loc.lat ?? ''}|${loc.lng ?? ''}`;
}

export function getRecentLocations(): StoredLocation[] {
  return read(RECENT_KEY);
}

export function getSavedLocations(): StoredLocation[] {
  return read(SAVED_KEY);
}

export function addRecentLocation(loc: Omit<StoredLocation, 'id'>) {
  const key = locationKey(loc);
  const items = read(RECENT_KEY).filter((item) => locationKey(item) !== key);
  items.unshift({ ...loc, id: crypto.randomUUID() });
  write(RECENT_KEY, items.slice(0, MAX_RECENT));
}

export function toggleSavedLocation(loc: Omit<StoredLocation, 'id'>) {
  const key = locationKey(loc);
  const saved = read(SAVED_KEY);
  const existing = saved.find((item) => locationKey(item) === key);
  if (existing) {
    write(
      SAVED_KEY,
      saved.filter((item) => item.id !== existing.id)
    );
    return false;
  }
  saved.unshift({ ...loc, id: crypto.randomUUID() });
  write(SAVED_KEY, saved.slice(0, MAX_SAVED));
  return true;
}

export function isLocationSaved(loc: Pick<StoredLocation, 'name' | 'lat' | 'lng'>) {
  const key = locationKey(loc);
  return read(SAVED_KEY).some((item) => locationKey(item) === key);
}

export function getQuickPickLocations(): StoredLocation[] {
  const saved = getSavedLocations();
  const recent = getRecentLocations().filter(
    (r) => !saved.some((s) => locationKey(s) === locationKey(r))
  );
  return [...saved, ...recent];
}
