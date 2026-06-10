import type {
  AvailableDriver,
  DriverAnalytics,
  DriverDashboard,
  DriverProfile,
  PendingVerification,
  Ride,
  User,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function request<T>(path: string, options: RequestInit = {}, retries = 1): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data as T;
  } catch (err) {
    const isNetwork =
      err instanceof TypeError ||
      (err instanceof Error && /failed to fetch|network/i.test(err.message));
    if (retries > 0 && isNetwork && navigator.onLine) {
      await sleep(800);
      return request<T>(path, options, retries - 1);
    }
    if (isNetwork && !navigator.onLine) {
      throw new Error('You are offline. Check your connection and try again.');
    }
    throw err;
  }
}

export const api = {
  register: (body: Record<string, unknown>) =>
    request<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (email: string, password: string) =>
    request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request<{ ok: boolean }>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () => request<User>('/auth/me'),

  getAvailableDrivers: () => request<AvailableDriver[]>('/drivers/available'),

  updateDriverStatus: (isOnline: boolean) =>
    request('/drivers/status', {
      method: 'PUT',
      body: JSON.stringify({ isOnline }),
    }),

  getDashboard: () => request<DriverDashboard>('/drivers/dashboard'),

  createRide: (body: {
    pickupLocation: string;
    destinationLocation: string;
    pickupLat?: number;
    pickupLng?: number;
    destLat?: number;
    destLng?: number;
    scheduledAt?: string;
  }) =>
    request<Ride>('/rides', { method: 'POST', body: JSON.stringify(body) }),

  getActiveRide: () => request<Ride | null>('/rides/active'),

  getPendingRides: () => request<Ride[]>('/rides/pending'),

  getRideHistory: () => request<Ride[]>('/rides/history'),

  acceptRide: (id: string) => request<Ride>(`/rides/${id}/accept`, { method: 'PUT' }),

  rejectRide: (id: string) => request(`/rides/${id}/reject`, { method: 'PUT' }),

  startRide: (id: string) => request<Ride>(`/rides/${id}/start`, { method: 'PUT' }),

  completeRide: (id: string) => request<Ride>(`/rides/${id}/complete`, { method: 'PUT' }),

  cancelRide: (id: string, reason?: string) =>
    request<Ride>(`/rides/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),

  rateRide: (id: string, rating: number, feedback?: string) =>
    request(`/rides/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, feedback }),
    }),

  updateProfile: (body: { name?: string; phone?: string }) =>
    request<User>('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),

  updateDriverLocation: (lat: number, lng: number) =>
    request('/drivers/location', { method: 'PUT', body: JSON.stringify({ lat, lng }) }),

  getDriverAnalytics: () => request<DriverAnalytics>('/drivers/analytics'),

  updateVehicle: (body: {
    vehicleType?: string;
    vehicleNumber?: string;
  }) =>
    request<DriverProfile>('/drivers/vehicle', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  submitVerification: (body: {
    licenseNumber: string;
    governmentIdNumber: string;
  }) =>
    request<DriverProfile>('/drivers/verification', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  getPendingVerifications: () =>
    request<PendingVerification[]>('/admin/verifications/pending'),

  reviewVerification: (
    userId: string,
    body: { status: 'VERIFIED' | 'REJECTED'; rejectionReason?: string }
  ) =>
    request<PendingVerification>(`/admin/verifications/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
};
