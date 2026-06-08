import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type MarkerType = 'pickup' | 'destination' | 'driver';

export interface MapMarker {
  position: [number, number];
  type: MarkerType;
  label?: string;
}

interface MapViewProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}

const MARKER_COLORS: Record<MarkerType, string> = {
  pickup: '#4caf7d',
  destination: '#e05c4b',
  driver: '#f5a623',
};

const MARKER_LABELS: Record<MarkerType, string> = {
  pickup: 'P',
  destination: 'D',
  driver: '🚗',
};

function makeIcon(type: MarkerType) {
  const color = MARKER_COLORS[type];
  const label = MARKER_LABELS[type];
  const isDriver = type === 'driver';
  return L.divIcon({
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `
      <div style="
        width:32px;height:32px;
        background:${color};
        border:2.5px solid white;
        border-radius:50%;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
        font-size:${isDriver ? '14px' : '11px'};
        font-weight:700;color:white;
        ${isDriver ? 'animation:driver-pulse 1.5s ease-in-out infinite;' : ''}
      ">${label}</div>
      <style>
        @keyframes driver-pulse {
          0%,100%{transform:scale(1);box-shadow:0 2px 8px rgba(0,0,0,0.35);}
          50%{transform:scale(1.15);box-shadow:0 4px 16px rgba(245,166,35,0.5);}
        }
      </style>
    `,
  });
}

export function MapView({ center, zoom = 15, markers = [], onMapClick, className = '' }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<L.Marker[]>([]);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    if (onMapClick) {
      map.on('click', (e) => onMapClick(e.latlng.lat, e.latlng.lng));
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update center when it changes (e.g. driver location)
  useEffect(() => {
    mapRef.current?.setView(center, mapRef.current.getZoom(), { animate: true });
  }, [center[0], center[1]]);

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markerRefs.current.forEach((m) => m.remove());
    markerRefs.current = markers.map((m) => {
      const marker = L.marker(m.position, { icon: makeIcon(m.type) }).addTo(map);
      if (m.label) marker.bindTooltip(m.label, { permanent: false, direction: 'top' });
      return marker;
    });

    // Fit bounds when multiple markers
    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map((m) => m.position));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, animate: true });
    }
  }, [JSON.stringify(markers)]);

  return <div ref={containerRef} className={className} style={{ zIndex: 0 }} />;
}
