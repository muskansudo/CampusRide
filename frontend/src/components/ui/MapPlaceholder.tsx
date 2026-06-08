interface MapPlaceholderProps {
  showPulse?: boolean;
  showRoute?: boolean;
}

export function MapPlaceholder({ showPulse, showRoute }: MapPlaceholderProps) {
  return (
    <div className="map-placeholder absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 opacity-30">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M-20 180 Q120 220 200 320 T380 420"
            fill="none"
            stroke="rgba(133, 115, 110, 0.25)"
            strokeWidth="2"
            strokeDasharray="6 8"
          />
          <path
            d="M40 120 Q180 280 280 360 T360 520"
            fill="none"
            stroke="rgba(113, 79, 150, 0.2)"
            strokeWidth="3"
          />
        </svg>
      </div>

      {showRoute && (
        <svg className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden>
          <path
            d="M80 200 Q140 360 260 400 T320 560"
            fill="none"
            stroke="#714f96"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
          />
          <circle cx="80" cy="200" r="5" fill="#6f3727" />
        </svg>
      )}

      {showPulse && (
        <div className="absolute left-[58%] top-[48%] -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="h-3 w-3 rounded-full bg-tertiary live-pulse-tertiary" />
            <div className="absolute inset-0 scale-[2.5] rounded-full bg-tertiary/20 blur-sm" />
          </div>
        </div>
      )}

      {!showPulse && (
        <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
            <div className="h-3 w-3 rounded-full border-2 border-white bg-primary" />
          </div>
        </div>
      )}

      <div
        className="absolute inset-x-0 bottom-0 h-32"
        style={{
          background: 'linear-gradient(to top, #fef8f3, transparent)',
        }}
      />
    </div>
  );
}
