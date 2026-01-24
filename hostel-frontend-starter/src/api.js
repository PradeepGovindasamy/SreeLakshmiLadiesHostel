// src/api.js
import axios from 'axios';
import { API_BASE_URL } from './config/api';

const api = axios.create({
  baseURL: API_BASE_URL, // Dynamically set based on environment
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add Authorization header automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('API Request:', config.method.toUpperCase(), config.url, config.headers.Authorization ? 'with token' : 'no token');
  return config;
});

// Add response interceptor for token refresh and error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.method.toUpperCase(), response.config.url, response.status);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh');

      if (!refreshToken) {
        // No refresh token, redirect to login
        console.error('No refresh token available, redirecting to login');
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh the token
        const response = await axios.post(`${API_BASE_URL}/api/token/refresh/`, {
          refresh: refreshToken
        });

        const { access } = response.data;
        localStorage.setItem('access', access);

        // Update authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers.Authorization = `Bearer ${access}`;

        // Process queued requests
        processQueue(null, access);
        isRefreshing = false;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear storage and redirect to login
        processQueue(refreshError, null);
        isRefreshing = false;
        
        console.error('Token refresh failed:', refreshError);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

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
    // Base methods
    list: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/v2/tenants/${queryString ? '?' + queryString : ''}`;
      return api.get(url);
    },
    get: (id) => api.get(`/api/v2/tenants/${id}/`),
    create: (data) => api.post('/api/v2/tenants/', data),
    update: (id, data) => api.put(`/api/v2/tenants/${id}/`, data),
    delete: (id) => api.delete(`/api/v2/tenants/${id}/`),
    
    // Helper methods for specific status
    listActive: (params = {}) => {
      return api.get('/api/v2/tenants/', { 
        params: { ...params, status: 'active' } 
      });
    },
    listVacated: (page = 1, pageSize = 25, params = {}) => {
      return api.get('/api/v2/tenants/', { 
        params: { ...params, status: 'vacated', page, page_size: pageSize } 
      });
    },
    listPending: (params = {}) => {
      return api.get('/api/v2/tenants/', { 
        params: { ...params, status: 'pending' } 
      });
    },
    
    // Actions
    getPayments: (id) => api.get(`/api/v2/tenants/${id}/payments/`),
    checkout: (id, data) => api.post(`/api/v2/tenants/${id}/checkout/`, data),
    reactivate: (id) => api.post(`/api/v2/tenants/${id}/reactivate/`),
  },
  
  payments: {
    list: () => api.get('/api/v2/payments/'),
    get: (id) => api.get(`/api/v2/payments/${id}/`),
    create: (data) => api.post('/api/v2/payments/', data),
    getMonthlySummary: (params) => api.get('/api/v2/payments/monthly_summary/', { params }),
  },
};

// Legacy API (for backward compatibility)
export const legacyAPI = {
  branches: () => api.get('/api/branches/'),
  rooms: () => api.get('/api/rooms/'),
  tenants: () => api.get('/api/tenants/'),
  payments: () => api.get('/api/payments/'),
};

export default api;
