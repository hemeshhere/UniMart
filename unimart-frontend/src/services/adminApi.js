/**
 * adminApi.js
 * ─────────────────────────────────────────────────────────────
 * Central API client for all /api/admin/* requests.
 *
 * Design decisions:
 *  - Built on top of the same Axios instance pattern as api.js
 *  - JWT is pulled from localStorage and injected automatically
 *  - 401 → clears session (expired token)
 *  - 403 → throws a typed error so AdminDashboard can show the
 *           full-screen "Access Denied" overlay
 *  - 500 → surfaces the server message, falls back gracefully
 *  - Base URL: uses the Vite proxy ("/api/admin") in dev so we
 *              never hardcode the backend port here. In production
 *              Vercel routes this via vercel.json rewrites.
 */

import axios from 'axios';

// ─── CLIENT ──────────────────────────────────────────────────
const adminApi = axios.create({
  // Uses the Vite dev proxy → http://localhost:3000/api/admin
  // In production, this hits the real backend directly (same domain via Vercel rewrites)
  baseURL: '/api/admin',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ─── REQUEST INTERCEPTOR: Attach JWT ─────────────────────────
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR: Handle auth errors ────────────────
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token expired — clear session, let React Router redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.warn('[AdminAPI] 401 – Session expired. Clearing auth.');
    }

    if (status === 403) {
      // Not an admin — surface a typed error so the UI can show the overlay
      console.error('[AdminAPI] 403 – Admin clearance required.');
      const forbiddenError = new Error('FORBIDDEN');
      forbiddenError.status = 403;
      return Promise.reject(forbiddenError);
    }

    if (status >= 500) {
      console.error('[AdminAPI] Server error:', error.response?.data?.error || error.message);
    }

    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════════════════
//  PILLAR 1 – Analytics
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/stats
 * Returns: { totalUsers, bannedUsers, totalCirculatingCoins, liveOrders }
 */
export const fetchDashboardStats = async () => {
  const res = await adminApi.get('/stats');
  return res.data?.data ?? null;
};

// ═══════════════════════════════════════════════════════════════
//  PILLAR 2 – User Control
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/users
 * Supports: ?page=1&limit=100
 * Returns: { data: User[], pagination: {...} }
 */
export const fetchAllUsers = async ({ page = 1, limit = 100 } = {}) => {
  const res = await adminApi.get(`/users?page=${page}&limit=${limit}`);
  const data = res.data?.data ?? res.data;
  return Array.isArray(data) ? data : [];
};

/**
 * GET /api/admin/users/:id/orders
 * Returns: { totalOrdered, totalDelivered, ordersAsbuyer[], ordersAsRunner[] }
 */
export const fetchUserOrderHistory = async (userId) => {
  const res = await adminApi.get(`/users/${userId}/orders`);
  return res.data?.data ?? res.data;
};

/**
 * PUT /api/admin/users/:id/ban
 * Toggles isBanned. No body needed.
 * Returns: { id, isBanned }
 */
export const toggleUserBan = async (userId) => {
  const res = await adminApi.put(`/users/${userId}/ban`);
  return res.data?.data ?? res.data;
};

/**
 * PUT /api/admin/users/:id/coins
 * Body: { action: 'add' | 'deduct', amount: Number }
 * Returns: { id, uniCoins }
 */
export const adjustUserCoins = async (userId, action, amount) => {
  const res = await adminApi.put(`/users/${userId}/coins`, { action, amount });
  return res.data?.data ?? res.data;
};

// ═══════════════════════════════════════════════════════════════
//  PILLAR 3 – Live Order Oversight
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/orders/live
 * Returns PENDING, ACCEPTED, PICKED_UP orders
 * populated with buyerId (name, hostel, roomNumber, phoneNumber)
 * and runnerId (name, phoneNumber)
 */
export const fetchLiveOrders = async () => {
  const res = await adminApi.get('/orders/live');
  const data = res.data?.data ?? res.data;
  return Array.isArray(data) ? data : [];
};

/**
 * PUT /api/admin/orders/:id/cancel
 * Cancels the order and triggers refunds.
 * Returns the cancelled order document.
 */
export const cancelLiveOrder = async (orderId) => {
  const res = await adminApi.put(`/orders/${orderId}/cancel`);
  return res.data?.data ?? res.data;
};

// ═══════════════════════════════════════════════════════════════
//  PILLAR 4 – Canteen Control
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/canteens
 * Supports: ?search=name&isOpen=true|false
 * Returns full canteen documents including menu[]
 */
export const fetchAllCanteens = async ({ search = '', isOpen } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (isOpen !== undefined) params.set('isOpen', String(isOpen));

  const res = await adminApi.get(`/canteens?${params.toString()}`);
  const data = res.data?.data ?? res.data;
  return Array.isArray(data) ? data : [];
};

/**
 * POST /api/admin/canteens
 * Body: { name, location, packingFee, menu[] }
 * Returns the created Canteen document
 */
export const createCanteen = async (canteenData) => {
  const res = await adminApi.post('/canteens', canteenData);
  return res.data?.data ?? res.data;
};

/**
 * PUT /api/admin/canteens/:id/toggle
 * Flips isOpen and broadcasts canteen_status_changed via Socket.IO
 * Returns: { id, isOpen }
 */
export const toggleCanteenStatus = async (canteenId) => {
  const res = await adminApi.put(`/canteens/${canteenId}/toggle`);
  return res.data?.data ?? res.data;
};

export default adminApi;
