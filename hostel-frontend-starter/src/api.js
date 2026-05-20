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
  getProfile: () => api.get('/api/auth/profile/'),
  create: (data) => api.post('/api/users/', data),
  update: (id, data) => api.put(`/api/users/${id}/`, data),
  updateProfile: (data) => api.patch('/api/auth/profile/', data),
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
    getPayments:    (id)         => api.get(`/api/v2/tenants/${id}/payments/`),
    getRentLedger:  (id)         => api.get(`/api/v2/tenants/${id}/rent-ledger/`),
    getRentStatus:  (id, month)  => api.get(`/api/v2/tenants/${id}/rent-status/`, month ? { params: { month } } : {}),
    recordPayment:  (id, data)   => api.post(`/api/v2/tenants/${id}/record-payment/`, data),
    checkout:       (id, data)   => api.post(`/api/v2/tenants/${id}/checkout/`, data),
    reactivate:     (id)         => api.post(`/api/v2/tenants/${id}/reactivate/`),
  },
  
  payments: {
    list: () => api.get('/api/v2/payments/'),
    get: (id) => api.get(`/api/v2/payments/${id}/`),
    create: (data) => api.post('/api/v2/payments/', data),
    getMonthlySummary: (params) => api.get('/api/v2/payments/monthly_summary/', { params }),
  },

  foodMenu: {
    list: (params = {}) => api.get('/api/v2/food-menu/', { params }),
    get: (id) => api.get(`/api/v2/food-menu/${id}/`),
    create: (data) => api.post('/api/v2/food-menu/', data),
    update: (id, data) => api.put(`/api/v2/food-menu/${id}/`, data),
    patch: (id, data) => api.patch(`/api/v2/food-menu/${id}/`, data),
    delete: (id) => api.delete(`/api/v2/food-menu/${id}/`),
    today: () => api.get('/api/v2/food-menu/today/'),
    week: () => api.get('/api/v2/food-menu/week/'),
  },

  foodMenuItems: {
    list: (params = {}) => api.get('/api/v2/food-menu-items/', { params }),
    create: (data) => api.post('/api/v2/food-menu-items/', data),
    update: (id, data) => api.put(`/api/v2/food-menu-items/${id}/`, data),
    delete: (id) => api.delete(`/api/v2/food-menu-items/${id}/`),
  },

  menuIngredients: {
    list: (params = {}) => api.get('/api/v2/menu-ingredients/', { params }),
    create: (data) => api.post('/api/v2/menu-ingredients/', data),
    update: (id, data) => api.put(`/api/v2/menu-ingredients/${id}/`, data),
    delete: (id) => api.delete(`/api/v2/menu-ingredients/${id}/`),
  },

  mealAvailability: {
    list: (params = {}) => api.get('/api/v2/meal-availability/', { params }),
    myAvailability: () => api.get('/api/v2/meal-availability/my/'),
    bulkUpdate: (updates) => api.post('/api/v2/meal-availability/bulk-update/', updates),
    create: (data) => api.post('/api/v2/meal-availability/', data),
    update: (id, data) => api.put(`/api/v2/meal-availability/${id}/`, data),
    delete: (id) => api.delete(`/api/v2/meal-availability/${id}/`),
  },

  mealCounts: {
    list: (params = {}) => api.get('/api/v2/meal-counts/', { params }),
    live: (params = {}) => api.get('/api/v2/meal-counts/live/', { params }),
    triggerConsumption: (data) => api.post('/api/v2/meal-counts/trigger-consumption/', data),
  },

  inventoryTransactions: {
    list: (params = {}) => api.get('/api/groceries/transactions/', { params }),
    record: (data) => api.post('/api/groceries/transactions/record/', data),
  },
};

export const groceriesAPI = {
  categories: {
    list: () => api.get('/api/groceries/categories/'),
    create: (data) => api.post('/api/groceries/categories/', data),
    update: (id, data) => api.put(`/api/groceries/categories/${id}/`, data),
    delete: (id) => api.delete(`/api/groceries/categories/${id}/`),
  },
  items: {
    list: (params = {}) => api.get('/api/groceries/items/', { params }),
    create: (data) => api.post('/api/groceries/items/', data),
    update: (id, data) => api.put(`/api/groceries/items/${id}/`, data),
    delete: (id) => api.delete(`/api/groceries/items/${id}/`),
    history: (id, params = {}) => api.get(`/api/groceries/items/${id}/history/`, { params }),
  },
  vendors: {
    list: () => api.get('/api/groceries/vendors/'),
    create: (data) => api.post('/api/groceries/vendors/', data),
    update: (id, data) => api.put(`/api/groceries/vendors/${id}/`, data),
    delete: (id) => api.delete(`/api/groceries/vendors/${id}/`),
  },
  stock: {
    list: (params = {}) => api.get('/api/groceries/stock/', { params }),
    dashboard: (params = {}) => api.get('/api/groceries/stock/dashboard/', { params }),
    history: (id) => api.get(`/api/groceries/stock/${id}/history/`),
  },
  purchases: {
    list: (params = {}) => api.get('/api/groceries/purchases/', { params }),
    record: (data) => api.post('/api/groceries/purchases/record/', data),
  },
  transactions: {
    list: (params = {}) => api.get('/api/groceries/transactions/', { params }),
    record: (data) => api.post('/api/groceries/transactions/record/', data),
  },
};

// Manager / Warden assignment API (active /api/v2/ endpoints)
export const managerAPI = {
  // Assign or update a manager for a branch
  // POST /api/v2/branches/{id}/assign_manager/
  assign: (branchId, data) =>
    api.post(`/api/v2/branches/${branchId}/assign_manager/`, data),

  // List active managers for a branch
  // GET /api/v2/branches/{id}/managers/
  list: (branchId) =>
    api.get(`/api/v2/branches/${branchId}/managers/`),

  // Update permission flags for an assignment
  // PATCH /api/v2/branches/{id}/managers/{assignmentId}/permissions/
  updatePermissions: (branchId, assignmentId, permissions) =>
    api.patch(
      `/api/v2/branches/${branchId}/managers/${assignmentId}/permissions/`,
      permissions
    ),

  // Soft-remove a manager from a branch
  // DELETE /api/v2/branches/{id}/managers/{assignmentId}/
  remove: (branchId, assignmentId) =>
    api.delete(`/api/v2/branches/${branchId}/managers/${assignmentId}/`),
};

/**
 * Tenant self-service API — all calls derive tenant from request.user.
 * No tenant ID is ever passed from the client for these endpoints.
 */
export const myAPI = {
  profile:    () => api.get('/api/my/profile/'),
  rentStatus: (month) =>
    api.get('/api/my/rent-status/', month ? { params: { month } } : {}),
  rentLedger: () => api.get('/api/my/rent-ledger/'),
  payments:   () => api.get('/api/my/payments/'),
};

export default api;
