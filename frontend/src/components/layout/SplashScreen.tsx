import { DreamscapeBackground } from './DreamscapeBackground';

interface SplashScreenProps {
  message?: string;
}

export function SplashScreen({ message = 'Synchronizing' }: SplashScreenProps) {
  return (
    <>
      <DreamscapeBackground />
      <div className="relative z-10 flex min-h-screen w-full flex-1 flex-col items-center justify-center">
        <div className="flex flex-col items-center page-enter">
          <h1 className="glow-underline font-display text-4xl font-bold text-primary">
            CampusRide
          </h1>
          <p className="mt-5 text-xs font-medium uppercase tracking-[0.2em] text-on-surface-variant">
            Campus mobility, simplified
          </p>
          <div
            className="mt-12 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
            role="status"
            aria-label="Loading"
          />
          <p className="mt-3 text-[10px] font-medium uppercase tracking-widest text-primary/60">
            {message}
          </p>
        </div>
      </div>
    </>
  );
}
