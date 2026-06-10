export type Role = 'PASSENGER' | 'DRIVER' | 'ADMIN';

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
  licenseNumber: string | null;
  governmentIdNumber: string | null;
  verificationRejectionReason: string | null;
  verificationSubmittedAt: string | null;
  verificationStatus: string;
  isOnline: boolean;
  upiId: string | null;
}

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type PaymentMethod = 'UPI' | 'QR_CODE' | 'CASH';

export interface Payment {
  id: string;
  rideId: string;
  passengerId: string;
  driverId: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod | null;
  upiTransactionId: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface PaymentHistoryItem extends Payment {
  ride: { pickupLocation: string; destinationLocation: string; completedAt: string | null };
  driver?: { name: string };
  passenger?: { name: string };
}

export interface PendingVerification {
  id: string;
  licenseNumber: string | null;
  governmentIdNumber: string | null;
  verificationSubmittedAt: string | null;
  vehicleType: string;
  vehicleNumber: string;
  user: { id: string; name: string; email: string; phone: string | null };
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
  cancelledBy: string | null;
  cancelledAt: string | null;
  scheduledAt: string | null;
  driversNotifiedAt: string | null;
  requestedAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  passenger: RideUser;
  driver: RideUser | null;
  rating: Rating | null;
  payment: Payment | null;
}

export interface DriverDashboard {
  isOnline: boolean;
  vehicleType: string;
  vehicleNumber: string;
  totalRidesCompleted: number;
  todayEarnings: number;
  todayRides: number;
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
    passengerId: string;
    driverId: string | null;
    pickupLocation: string;
    destinationLocation: string;
    status: RideStatus;
    cancelledBy: string | null;
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
  peakHours: Array<{ hour: number; count: number }>;
  pickupHotspots: Array<{ location: string; count: number }>;
  destinationHotspots: Array<{ location: string; count: number }>;
  campusDemandRideCount: number;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
