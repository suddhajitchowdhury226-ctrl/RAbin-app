/**
 * Central API service for Rabin-App.
 * All network calls to the Robin backend go through here.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://app-server-maaw.onrender.com/api/v1';
export const API_BASE = BASE_URL;

// ─── Core Fetch Wrapper (declared first — used by silentRefresh below) ────────
const fetchWithTimeout = (url, options = {}, timeout = 30000) =>
  Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Server is waking up, please try again in a moment...')), timeout)
    ),
  ]);

// ─── Storage Helpers ──────────────────────────────────────────────────────────
export const storeToken = (token) => AsyncStorage.setItem('accessToken', token);
export const getToken = () => AsyncStorage.getItem('accessToken');
export const removeToken = () => AsyncStorage.removeItem('accessToken');
export const storeRefreshToken = (token) => AsyncStorage.setItem('refreshToken', token);
export const getRefreshToken = () => AsyncStorage.getItem('refreshToken');
export const removeRefreshToken = () => AsyncStorage.removeItem('refreshToken');
export const storeUser = (user) => AsyncStorage.setItem('user', JSON.stringify(user));
export const getUser = async () => {
  const u = await AsyncStorage.getItem('user');
  return u ? JSON.parse(u) : null;
};
export const removeUser = () => AsyncStorage.removeItem('user');

// Login timestamp — used for 30-day session check
export const storeLoginTime = () => AsyncStorage.setItem('loginTime', String(Date.now()));
export const getLoginTime = () => AsyncStorage.getItem('loginTime');
export const removeLoginTime = () => AsyncStorage.removeItem('loginTime');

const SESSION_MAX_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Returns true if the stored session is still within 30 days */
export const isSessionValid = async () => {
  const loginTime = await getLoginTime();
  if (!loginTime) return false;
  return Date.now() - Number(loginTime) < SESSION_MAX_MS;
};

/**
 * Silently exchange the stored refresh token for a new access token.
 * Returns true on success, false if the refresh token is expired/missing.
 */
export const silentRefresh = async () => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;

    const res = await fetchWithTimeout(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }, 15000);
    const json = await res.json();
    if (!res.ok || !json.data?.accessToken) return false;

    await storeToken(json.data.accessToken);
    if (json.data.refreshToken) await storeRefreshToken(json.data.refreshToken);
    if (json.data.user) await storeUser(json.data.user);
    return true;
  } catch {
    return false;
  }
};

// ─── Session Clear ────────────────────────────────────────────────────────────
const handleSessionExpired = async () => {
  await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user', 'loginTime']);
  router.replace('/(auth)/login');
};

// ─── Authenticated Request ────────────────────────────────────────────────────
const request = async (path, options = {}) => {
  const token = await getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetchWithTimeout(`${BASE_URL}${path}`, { ...options, headers }, 30000);
  const json = await res.json();

  if (!res.ok) {
    const message = json.message || `HTTP ${res.status}`;

    const isTokenError =
      res.status === 401 ||
      message.toLowerCase().includes('token expired') ||
      message.toLowerCase().includes('invalid token') ||
      message.toLowerCase().includes('jwt expired') ||
      message.toLowerCase().includes('not authorized') ||
      message.toLowerCase().includes('unauthorized');

    if (isTokenError) {
      // Try a silent refresh before giving up
      const refreshed = await silentRefresh();
      if (refreshed) {
        // Retry the original request once with the new token
        return request(path, options);
      }
      await handleSessionExpired();
      throw new Error('Session expired. Please log in again.');
    }

    throw new Error(message);
  }

  return json.data;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
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

  logout: async () => {
    const refreshToken = await getRefreshToken();
    return request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  forgotPassword: (email) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Sends the Google idToken to the backend for verification
  googleLogin: (idToken) =>
    request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }),

  sendOtp: (email) =>
    request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email, otp) =>
    request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),
};

// ─── Services ─────────────────────────────────────────────────────────────────
export const servicesApi = {
  list: (category) => request(`/services${category ? `?category=${category}` : ''}`),
  getBySlug: (slug) => request(`/services/${slug}`),
  getPackages: (slug) => request(`/services/${slug}/packages`),
};

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const bookingsApi = {
  list: (status) => request(`/bookings${status ? `?status=${status}` : ''}`),
  create: (payload) => request('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  getById: (id) => request(`/bookings/${id}`),
  cancel: (id) => request(`/bookings/${id}/cancel`, { method: 'PUT' }),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsApi = {
  createOrder: (bookingId) =>
    request('/payments/create-order', { method: 'POST', body: JSON.stringify({ bookingId }) }),
  verify: ({ orderId, paymentId, signature }) =>
    request('/payments/verify', { method: 'POST', body: JSON.stringify({ orderId, paymentId, signature }) }),
  getByBooking: (bookingId) => request(`/payments/${bookingId}`),
};

// ─── Delivery Tracking ────────────────────────────────────────────────────────
export const deliveryApi = {
  getTracking: (bookingId) => request(`/delivery/${bookingId}`),
  submitFeedback: (bookingId, { rating, comment }) =>
    request(`/delivery/${bookingId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    }),
  submitStageResponse: (bookingId, { stageId, fieldId, response }) =>
    request(`/delivery/${bookingId}/stage-response`, {
      method: 'POST',
      body: JSON.stringify({ stageId, fieldId, response }),
    }),
};

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const chatApi = {
  getRooms: () => request('/chat/rooms'),
  getMessages: (roomId, page = 1) => request(`/chat/rooms/${roomId}/messages?page=${page}`),
  sendMessage: (roomId, content, type = 'TEXT') => request(`/chat/rooms/${roomId}/messages`, {
    method: 'POST', body: JSON.stringify({ content, messageType: type }),
  }),
  markAsRead: (roomId) => request(`/chat/rooms/${roomId}/read`, { method: 'PUT' }),
};

// ─── Profile ──────────────────────────────────────────────────────────────────
export const profileApi = {
  get: () => request('/profile'),
  update: ({ name, phone }) => request('/profile', { method: 'PUT', body: JSON.stringify({ name, phone }) }),
  delete: () => request('/profile', { method: 'DELETE' }),

  changePassword: ({ currentPassword, newPassword }) =>
    request('/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  uploadAvatar: async (imageUri) => {
    const token = await getToken();
    const formData = new FormData();
    const filename = imageUri.split('/').pop();
    const ext = filename.split('.').pop();
    formData.append('avatar', { uri: imageUri, name: filename, type: ext === 'png' ? 'image/png' : 'image/jpeg' });
    const res = await fetch(`${BASE_URL}/profile/avatar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'multipart/form-data', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
    return json.data;
  },
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  /** Fetch my notifications (global + personal). Returns { notifications, unreadCount } */
  list: (page = 1) => request(`/notifications?page=${page}`),

  /** Mark a single notification as read */
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),

  /** Mark all notifications as read */
  markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
};
