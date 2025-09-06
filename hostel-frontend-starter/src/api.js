// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000', // Backend URL
});

// Add Authorization header automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('API Request:', config.method.toUpperCase(), config.url, config.headers.Authorization ? 'with token' : 'no token');
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.method.toUpperCase(), response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error.config?.method?.toUpperCase(), error.config?.url, error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// Enhanced API methods for new backend capabilities
export const authAPI = {
  // Authentication endpoints
  login: (credentials) => api.post('/api/auth/login/', credentials),
  getUser: () => api.get('/api/auth/user/'),
  getProfile: () => api.get('/api/auth/profile/'),
  updateProfile: (data) => api.put('/api/auth/profile/', data),
  getAvailableBranches: () => api.get('/api/auth/branches/'),
};

export const userAPI = {
  // User management (enhanced)
  createUserWithProfile: (userData) => api.post('/api/users/create_with_profile/', userData),
  listUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `/api/users/${queryString ? '?' + queryString : ''}`;
    console.log('Calling users API:', url);
    return api.get(url);
  },
  list: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `/api/users/${queryString ? '?' + queryString : ''}`;
    console.log('Calling users list API:', url);
    return api.get(url);
  },
  get: (id) => api.get(`/api/users/${id}/`),
  create: (data) => api.post('/api/users/', data),
  update: (id, data) => api.put(`/api/users/${id}/`, data),
  delete: (id) => api.delete(`/api/users/${id}/`),
  updateUserProfile: (id, data) => api.patch(`/api/users/${id}/update_profile/`, data),
};

export const enhancedAPI = {
  // Enhanced endpoints with role-based filtering
  branches: {
    list: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/v2/branches/${queryString ? '?' + queryString : ''}`;
      console.log('Calling branches API:', url);
      return api.get(url);
    },
    get: (id) => api.get(`/api/v2/branches/${id}/`),
    create: (data) => api.post('/api/v2/branches/', data),
    update: (id, data) => api.put(`/api/v2/branches/${id}/`, data),
    delete: (id) => api.delete(`/api/v2/branches/${id}/`),
    getRooms: (id) => api.get(`/api/v2/branches/${id}/rooms/`),
    getTenants: (id) => api.get(`/api/v2/branches/${id}/tenants/`),
    getStats: (id) => api.get(`/api/v2/branches/${id}/occupancy_stats/`),
  },
  
  rooms: {
    list: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/v2/rooms/${queryString ? '?' + queryString : ''}`;
      console.log('Calling rooms API:', url);
      return api.get(url);
    },
    get: (id) => api.get(`/api/v2/rooms/${id}/`),
    create: (data) => api.post('/api/v2/rooms/', data),
    update: (id, data) => api.put(`/api/v2/rooms/${id}/`, data),
    delete: (id) => api.delete(`/api/v2/rooms/${id}/`),
    getTenants: (id) => api.get(`/api/v2/rooms/${id}/tenants/`),
    checkAvailability: (id) => api.get(`/api/v2/rooms/${id}/availability/`),
  },
  
  tenants: {
    list: () => api.get('/api/v2/tenants/'),
    get: (id) => api.get(`/api/v2/tenants/${id}/`),
    create: (data) => api.post('/api/v2/tenants/', data),
    update: (id, data) => api.put(`/api/v2/tenants/${id}/`, data),
    delete: (id) => api.delete(`/api/v2/tenants/${id}/`),
    getPayments: (id) => api.get(`/api/v2/tenants/${id}/payments/`),
    checkout: (id, data) => api.post(`/api/v2/tenants/${id}/checkout/`, data),
  },
  
  payments: {
    list: () => api.get('/api/v2/payments/'),
    get: (id) => api.get(`/api/v2/payments/${id}/`),
    create: (data) => api.post('/api/v2/payments/', data),
    getMonthlySummary: (params) => api.get('/api/v2/payments/monthly_summary/', { params }),
  },
};

// Firebase Phone OTP API
export const firebaseAPI = {
  sendOTP: (phoneNumber) => api.post('/api/auth/send-otp/', { phone_number: phoneNumber }),
  verifyOTP: (phoneNumber, otp, sessionInfo) => api.post('/api/auth/verify-otp/', {
    phone_number: phoneNumber,
    otp: otp,
    session_info: sessionInfo
  }),
  firebaseLogin: (idToken) => api.post('/api/auth/firebase-login/', { id_token: idToken }),
  verifyToken: (idToken) => api.post('/api/auth/verify-token/', { id_token: idToken }),
};

// Legacy API (for backward compatibility)
export const legacyAPI = {
  branches: () => api.get('/api/branches/'),
  rooms: () => api.get('/api/rooms/'),
  tenants: () => api.get('/api/tenants/'),
  payments: () => api.get('/api/payments/'),
};

export default api;
