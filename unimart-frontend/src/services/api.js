import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Automatically attach the JWT token if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Safely handle 401s without crashing Vercel
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // We log the error, but we DO NOT force a window.location.href reload
      console.warn("Session expired or unauthorized. App will handle redirect.");
      
      // Optional: You can clear storage, but let React Router do the actual moving
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const verifyOTP = async (email, otp) => {
  const response = await api.post('/auth/verify-otp', { email, otp });
  return response.data;
};

export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (email, otp, newPassword) => {
  try {
    const response = await api.post('/auth/reset-password', { email, otp, newPassword });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserProfile = async () => {
  const response = await api.get('/auth/me'); 
  return response.data;
};
// --- Canteen & Order Endpoints ---

export const getCanteens = async () => {
  const response = await api.get('/canteens');
  return response.data;
};

// Create a new order (Sends to the Live Radar)
export const createOrder = async (orderData) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};
// Fetch a specific canteen (which includes the heavy menu data)
export const getCanteenById = async (canteenId) => {
  const response = await api.get(`/canteens/${canteenId}`);
  return response.data;
};
// Check if the logged-in customer has an active order
export const getActiveCustomerOrder = async () => {
  const response = await api.get('/orders/customer');
  return response.data;
};
// Cancel an active order
export const cancelOrder = async (orderId) => {
  const response = await api.post(`/orders/${orderId}/cancel`);
  return response.data;
};

// --- Runner Endpoints ---

// Fetch all PENDING orders available for runners to pick up
export const getAvailableTasks = async () => {
  const response = await api.get('/orders/available');
  return response.data;
};

// Runner accepts an order (deducts 5 UniCoins)
export const acceptOrderAsRunner = async (orderId) => {
  const response = await api.put(`/orders/${orderId}/accept`);
  return response.data;
};

// Get the runner's currently active mission (if any)
export const getActiveRunnerMission = async () => {
  const response = await api.get('/orders/runner/active');
  return response.data;
};

// Runner marks food as collected from the canteen
export const markPickedUp = async (orderId) => {
  const response = await api.put(`/orders/${orderId}/pickup`);
  return response.data;
};

// Runner submits the buyer's 4-digit PIN to complete delivery
export const verifyDeliveryPIN = async (orderId, pin) => {
  const response = await api.post(`/orders/${orderId}/verify`, { enteredPIN: pin });
  return response.data;
};

// Runner aborts the mission (refunds 5 UniCoins)
export const abortMission = async (orderId, reason) => {
  const response = await api.post(`/orders/${orderId}/abort`, {reason});
  return response.data;
};

// --- Wallet Endpoints ---
export const topUpWallet = async (amount) => {
  const response = await api.post('/wallet/topup', { amountInINR: amount });
  return response.data;
};

// 2. Send the Razorpay success signature to the backend vault for verification
export const verifyRazorpayPayment = async (paymentData) => {
  const response = await api.post('/wallet/verify-payment', paymentData);
  return response.data;
};
export default api;