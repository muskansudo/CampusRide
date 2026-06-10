import { useEffect } from 'react';
import type { Ride } from '@/types';
import { getSocket } from '@/lib/socket';
import { showBrowserNotification } from '@/lib/notifications';
import { useAuthStore } from '@/store/authStore';

export function useRideNotifications() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;

    const onRequested = (ride: Ride) => {
      if (user.role !== 'DRIVER') return;
      showBrowserNotification(
        'New ride request',
        `${ride.passenger.name}: ${ride.pickupLocation} → ${ride.destinationLocation}`,
        `ride-request-${ride.id}`
      );
    };

    const onAccepted = (ride: Ride) => {
      if (user.role !== 'PASSENGER' || ride.passengerId !== user.id) return;
      const driverName = ride.driver?.name ?? 'A driver';
      showBrowserNotification(
        'Ride accepted',
        `${driverName} is on the way to ${ride.pickupLocation}`,
        `ride-accepted-${ride.id}`
      );
    };

    const onStatusUpdate = (ride: Ride) => {
      if (user.role === 'PASSENGER' && ride.passengerId === user.id) {
        if (ride.status === 'IN_PROGRESS') {
          showBrowserNotification(
            'Ride started',
            `Heading to ${ride.destinationLocation}`,
            `ride-started-${ride.id}`
          );
        } else if (ride.status === 'COMPLETED') {
          showBrowserNotification(
            'Ride completed',
            'Thanks for riding! Please rate your trip.',
            `ride-completed-${ride.id}`
          );
        }
      }
      if (user.role === 'DRIVER' && ride.driverId === user.id && ride.status === 'COMPLETED') {
        showBrowserNotification(
          'Ride completed',
          `Trip to ${ride.destinationLocation} is done.`,
          `ride-done-${ride.id}`
        );
      }
    };

    const onCancelled = (ride: Ride) => {
      const isPassenger = user.role === 'PASSENGER' && ride.passengerId === user.id;
      const isDriver = user.role === 'DRIVER' && ride.driverId === user.id;
      if (!isPassenger && !isDriver) return;
      showBrowserNotification(
        'Ride cancelled',
        isPassenger ? 'Your ride was cancelled.' : 'A passenger cancelled the ride.',
        `ride-cancelled-${ride.id}`
      );
    };

    socket.on('ride:requested', onRequested);
    socket.on('ride:accepted', onAccepted);
    socket.on('ride:status:update', onStatusUpdate);
    socket.on('ride:cancelled', onCancelled);

    return () => {
      socket.off('ride:requested', onRequested);
      socket.off('ride:accepted', onAccepted);
      socket.off('ride:status:update', onStatusUpdate);
      socket.off('ride:cancelled', onCancelled);
    };
  }, [user]);
}
