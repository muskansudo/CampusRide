
export function getCancelledByLabel(ride: {
  status: string;
  cancelledBy?: string | null;
  passengerId: string;
  driverId?: string | null;
}): string | null {
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
