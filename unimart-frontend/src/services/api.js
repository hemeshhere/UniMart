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

// Response Interceptor: Automatically log user out if token expires (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login'; // Force redirect to login
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