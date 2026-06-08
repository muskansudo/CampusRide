export type Role = 'PASSENGER' | 'DRIVER';

export type RideStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface DriverProfile {
  id: string;
  vehicleType: string;
  vehicleNumber: string;
  licenseInfo: string | null;
  verificationStatus: string;
  isOnline: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  driverProfile: DriverProfile | null;
}

export interface RideUser {
  id: string;
  name: string;
  phone: string | null;
  email?: string;
  driverProfile?: DriverProfile | null;
}

export interface Rating {
  id: string;
  rating: number;
  feedback: string | null;
  createdAt: string;
}

export interface Ride {
  id: string;
  passengerId: string;
  driverId: string | null;
  pickupLocation: string;
  destinationLocation: string;
  pickupLat: number | null;
  pickupLng: number | null;
  destLat: number | null;
  destLng: number | null;
  status: RideStatus;
  cancelReason: string | null;
  requestedAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  passenger: RideUser;
  driver: RideUser | null;
  rating: Rating | null;
}

export interface DriverDashboard {
  isOnline: boolean;
  vehicleType: string;
  vehicleNumber: string;
  totalRidesCompleted: number;
  activeRides: Ride[];
  averageRating: number;
  totalRatings: number;
  recentRatings: Array<{
    id: string;
    rating: number;
    feedback: string | null;
    passenger: { name: string };
    ride: { pickupLocation: string; destinationLocation: string };
  }>;
  rideHistory: Ride[];
}

export interface AvailableDriver {
  id: string;
  isOnline: boolean;
  vehicleType: string;
  vehicleNumber: string;
  user: { id: string; name: string; phone: string | null };
}

export interface DriverAnalytics {
  totalRidesCompleted: number;
  totalCancelled: number;
  averageRating: number;
  totalRatings: number;
  ridesThisWeek: number;
  completionRate: number;
  dailyRides: Array<{ date: string; count: number }>;
  activityLog: Array<{
    id: string;
    date: string;
    passengerName: string;
    pickupLocation: string;
    destinationLocation: string;
    status: RideStatus;
    rating: number | null;
  }>;
  recentRatings: Array<{
    id: string;
    rating: number;
    feedback: string | null;
    passenger: { name: string };
    ride: { pickupLocation: string; destinationLocation: string };
  }>;
  fullHistory: Ride[];
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
