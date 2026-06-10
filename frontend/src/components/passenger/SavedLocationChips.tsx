import { Star } from 'lucide-react';
import type { StoredLocation } from '@/lib/savedLocations';

interface SavedLocationChipsProps {
  locations: StoredLocation[];
  onSelect: (loc: StoredLocation) => void;
  savedIds: Set<string>;
  onToggleSave?: (loc: StoredLocation) => void;
  label?: string;
}

export function SavedLocationChips({
  locations,
  onSelect,
  savedIds,
  onToggleSave,
  label = 'Quick picks',
}: SavedLocationChipsProps) {
  if (locations.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {locations.map((loc) => {
          const isSaved = savedIds.has(loc.id);
          return (
            <div key={loc.id} className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onSelect(loc)}
                className="rounded-full border border-white/40 bg-white/30 px-3 py-1.5 text-left text-xs font-medium text-on-surface transition hover:bg-white/50"
              >
                {loc.name}
              </button>
              {onToggleSave && (
                <button
                  type="button"
                  onClick={() => onToggleSave(loc)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-primary/70 hover:bg-white/40"
                  aria-label={isSaved ? 'Remove from saved' : 'Save location'}
                >
                  <Star
                    className={['h-3.5 w-3.5', isSaved ? 'fill-primary text-primary' : ''].join(' ')}
                  />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
