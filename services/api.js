/**
 * Central API service for Rabin-App.
 * All network calls to the Robin backend go through here.
 *
 * Base URL: configure in .env as EXPO_PUBLIC_API_URL
 * Example:  EXPO_PUBLIC_API_URL=http://192.168.x.x:5000/api/v1
 *           (use your local machine's IP — NOT localhost — when testing on device/emulator)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000/api/v1';
// 10.0.2.2 = Android emulator's alias for the host machine's localhost
// For physical device: replace with your machine's local IP, e.g. http://192.168.1.5:5000/api/v1

export const API_BASE = BASE_URL;

// ─── Storage Helpers ──────────────────────────────────────────────────────────
export const storeToken = (token) => AsyncStorage.setItem('accessToken', token);
export const getToken = () => AsyncStorage.getItem('accessToken');
export const removeToken = () => AsyncStorage.removeItem('accessToken');
export const storeUser = (user) => AsyncStorage.setItem('user', JSON.stringify(user));
export const getUser = async () => {
  const u = await AsyncStorage.getItem('user');
  return u ? JSON.parse(u) : null;
};
export const removeUser = () => AsyncStorage.removeItem('user');

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────
const request = async (path, options = {}) => {
  const token = await getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || `HTTP ${res.status}`);
  }

  return json.data;
};

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  register: ({ name, email, password }) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: ({ email, password }) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request('/auth/logout', { method: 'POST' }),

  forgotPassword: (email) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

// ─── Services ────────────────────────────────────────────────────────────────
export const servicesApi = {
  list: (category) =>
    request(`/services${category ? `?category=${category}` : ''}`),

  getBySlug: (slug) =>
    request(`/services/${slug}`),

  getPackages: (slug) =>
    request(`/services/${slug}/packages`),
};

// ─── Bookings ────────────────────────────────────────────────────────────────
export const bookingsApi = {
  list: (status) =>
    request(`/bookings${status ? `?status=${status}` : ''}`),

  create: (payload) =>
    request('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getById: (id) =>
    request(`/bookings/${id}`),

  cancel: (id) =>
    request(`/bookings/${id}/cancel`, { method: 'PUT' }),
};

// ─── Payments ────────────────────────────────────────────────────────────────
export const paymentsApi = {
  createOrder: (bookingId) =>
    request('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ bookingId }),
    }),

  verify: ({ orderId, paymentId, signature }) =>
    request('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ orderId, paymentId, signature }),
    }),

  getByBooking: (bookingId) =>
    request(`/payments/${bookingId}`),
};

// ─── Chat ────────────────────────────────────────────────────────────────────
export const chatApi = {
  getRooms: () =>
    request('/chat/rooms'),

  getMessages: (roomId, page = 1) =>
    request(`/chat/rooms/${roomId}/messages?page=${page}`),

  sendMessage: (roomId, content, messageType = 'TEXT') =>
    request(`/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, messageType }),
    }),

  markAsRead: (roomId) =>
    request(`/chat/rooms/${roomId}/read`, { method: 'PUT' }),
};

// ─── Profile ─────────────────────────────────────────────────────────────────
export const profileApi = {
  get: () =>
    request('/profile'),

  update: ({ name, phone }) =>
    request('/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, phone }),
    }),

  changePassword: ({ currentPassword, newPassword }) =>
    request('/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  delete: () =>
    request('/profile', { method: 'DELETE' }),
};
