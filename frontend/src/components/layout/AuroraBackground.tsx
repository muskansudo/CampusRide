export function AuroraBackground() {
  return (
    <div className="app-bg-layer overflow-hidden" aria-hidden>
      <div className="aurora-canvas aurora-drift absolute inset-0" />
      <div
        className="absolute -top-20 -left-16 h-56 w-56 rounded-full opacity-25"
        style={{ backgroundColor: 'var(--color-primary-fixed)' }}
      />
      <div
        className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full opacity-20"
        style={{ backgroundColor: 'var(--color-secondary-container)' }}
      />
    </div>
  );
}
