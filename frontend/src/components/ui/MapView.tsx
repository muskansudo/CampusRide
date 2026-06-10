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
  route?: [number, number][];
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

export function MapView({
  center,
  zoom = 15,
  markers = [],
  route,
  onMapClick,
  className = '',
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<L.Marker[]>([]);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const onMapClickRef = useRef(onMapClick);

  onMapClickRef.current = onMapClick;

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

    map.on('click', (e) => {
      onMapClickRef.current?.(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    const resize = () => map.invalidateSize();
    resize();
    requestAnimationFrame(resize);

    const observer = new ResizeObserver(resize);
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView(center, map.getZoom(), { animate: true });
  }, [center[0], center[1]]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markerRefs.current.forEach((m) => m.remove());
    markerRefs.current = markers.map((m) => {
      const marker = L.marker(m.position, { icon: makeIcon(m.type) }).addTo(map);
      if (m.label) marker.bindTooltip(m.label, { permanent: false, direction: 'top' });
      return marker;
    });

    if (!route && markers.length > 1) {
      const bounds = L.latLngBounds(markers.map((m) => m.position));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, animate: true });
    }
  }, [JSON.stringify(markers), JSON.stringify(route)]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    routeLayerRef.current?.remove();
    routeLayerRef.current = null;

    if (route && route.length >= 2) {
      routeLayerRef.current = L.layerGroup([
        L.polyline(route, {
          color: '#ffffff',
          weight: 8,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }),
        L.polyline(route, {
          color: '#714f96',
          weight: 5,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }),
      ]).addTo(map);

      map.fitBounds(L.latLngBounds(route), { padding: [48, 48], maxZoom: 16, animate: true });
    }
  }, [JSON.stringify(route)]);

  return <div ref={containerRef} className={className} style={{ zIndex: 0 }} />;
}
