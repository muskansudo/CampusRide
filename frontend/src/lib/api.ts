import type { AvailableDriver, DriverAnalytics, DriverDashboard, Ride, User } from '../types';

const TOKEN_KEY = 'token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data as T;
}

export const api = {
  register: (body: Record<string, unknown>) =>
    request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (email: string, password: string) =>
    request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
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
};
