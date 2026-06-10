import { useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useNetworkStore } from '@/store/networkStore';

export function NetworkBanner() {
  const { isOnline, socketStatus, showReconnected, setOnline, clearReconnected } =
    useNetworkStore();

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [setOnline]);

  useEffect(() => {
    if (!showReconnected) return;
    const timer = setTimeout(clearReconnected, 3000);
    return () => clearTimeout(timer);
  }, [showReconnected, clearReconnected]);

  if (showReconnected && isOnline && socketStatus === 'connected') {
    return (
      <div className="fixed left-1/2 top-20 z-[60] w-[calc(100%-48px)] max-w-[600px] -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary-fixed/90 px-4 py-2.5 text-sm font-medium text-primary shadow-lg backdrop-blur">
          <Wifi className="h-4 w-4" />
          Back online — syncing rides
        </div>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="fixed left-1/2 top-20 z-[60] w-[calc(100%-48px)] max-w-[600px] -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-2xl border border-red-300/50 bg-red-50/95 px-4 py-2.5 text-sm font-medium text-red-800 shadow-lg backdrop-blur">
          <WifiOff className="h-4 w-4 shrink-0" />
          You&apos;re offline. Changes will sync when you reconnect.
        </div>
      </div>
    );
  }

  if (socketStatus === 'reconnecting') {
    return (
      <div className="fixed left-1/2 top-20 z-[60] w-[calc(100%-48px)] max-w-[600px] -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-2xl border border-amber-300/50 bg-amber-50/95 px-4 py-2.5 text-sm font-medium text-amber-900 shadow-lg backdrop-blur">
          <Wifi className="h-4 w-4 shrink-0 animate-pulse" />
          Reconnecting to live updates…
        </div>
      </div>
    );
  }

  return null;
}
