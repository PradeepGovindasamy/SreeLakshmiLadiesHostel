import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    Authorization: `Bearer ${localStorage.getItem('access')}`
  }
});

// Request interceptor to attach latest token
axiosInstance.interceptors.request.use(async config => {
  const accessToken = localStorage.getItem('access');
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor to refresh token on 401
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem('refresh');

    if (error.response.status === 401 && refreshToken && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
          refresh: refreshToken
        });

        localStorage.setItem('access', response.data.access);
        axiosInstance.defaults.headers['Authorization'] = `Bearer ${response.data.access}`;
        originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;

        return axiosInstance(originalRequest);  // Retry original request
      } catch (err) {
        console.error("Refresh token invalid", err);
        // Optional: redirect to login
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
