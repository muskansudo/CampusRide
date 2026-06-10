import { NavLink, Outlet } from 'react-router-dom';
import {
  BarChart2,
  History,
  Inbox,
  LayoutDashboard,
  MapPin,
  User as UserIcon,
} from 'lucide-react';
import type { Role } from '@/types';
import { DreamscapeBackground } from './DreamscapeBackground';
import { AppHeader } from './AppHeader';
import { NetworkBanner } from './NetworkBanner';
import { useRideNotifications } from '@/hooks/useRideNotifications';
import { useRideRequestStore } from '@/store/rideRequestStore';

interface NavItem {
  to: string;
  label: string;
  icon: typeof MapPin;
}

const passengerNav: NavItem[] = [
  { to: '/passenger', label: 'Home', icon: MapPin },
  { to: '/passenger/history', label: 'History', icon: History },
  { to: '/passenger/profile', label: 'Profile', icon: UserIcon },
];

const driverNav: NavItem[] = [
  { to: '/driver', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/driver/requests', label: 'Requests', icon: Inbox },
  { to: '/driver/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/driver/profile', label: 'Profile', icon: UserIcon },
];

interface AppLayoutProps {
  role: Role;
}

export function AppLayout({ role }: AppLayoutProps) {
  const nav = role === 'DRIVER' ? driverNav : passengerNav;
  useRideNotifications();
  const badgeCount = useRideRequestStore((s) => s.count);
  const clearBadge = useRideRequestStore((s) => s.clear);

  return (
    <>
      <DreamscapeBackground />
      <NetworkBanner />
      <div className="relative z-10 flex min-h-screen w-full flex-1 flex-col">
        <AppHeader />

        <main className="mx-auto w-full max-w-[600px] flex-1 overflow-y-auto px-6 pb-40 pt-24 page-enter">
          <Outlet />
        </main>

        <nav className="glass-nav-pill fixed bottom-6 left-1/2 z-50 w-[calc(100%-48px)] max-w-[400px] -translate-x-1/2">
          <div className="flex items-stretch justify-around px-2 py-2">
            {nav.map(({ to, label, icon: Icon }) => {
              const isRequestsTab = to === '/driver/requests';
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/passenger' || to === '/driver'}
                  onClick={() => { if (isRequestsTab) clearBadge(); }}
                  className={({ isActive }) =>
                    [
                      'relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-4 py-2 text-[11px] font-semibold tracking-wide transition duration-300',
                      isActive
                        ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(139,78,60,0.3)]'
                        : 'text-on-surface-variant/60 hover:bg-white/10',
                    ].join(' ')
                  }
                >
                  <span className="relative">
                    <Icon className="h-5 w-5" />
                    {isRequestsTab && badgeCount > 0 && (
                      <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </span>
                  {label}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
