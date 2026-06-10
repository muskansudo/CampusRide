import type { Ride } from '@/types';

/** Who cancelled a ride, for history UI. */
export function getCancelledByLabel(ride: Ride): string | null {
  if (ride.status !== 'CANCELLED') return null;

  if (!ride.cancelledBy) {
    return 'Cancelled';
  }
  if (ride.cancelledBy === ride.passengerId) {
    return 'Cancelled by passenger';
  }
  if (ride.driverId && ride.cancelledBy === ride.driverId) {
    return 'Cancelled by driver';
  }
  return 'Cancelled';
}
