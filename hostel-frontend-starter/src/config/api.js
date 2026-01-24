// API Configuration - Works for Local, Staging, and Production
const getApiUrl = () => {
  // Priority: Environment variable > Auto-detection > Fallback
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Auto-detect based on hostname (useful for quick deployments)
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Local development
    return 'http://127.0.0.1:8000';
  } else if (hostname.includes('yourdomain.com')) {
    // Production domain
    return 'https://api.yourdomain.com';
  } else {
    // Assume backend is on same host but port 8000
    return `${window.location.protocol}//${hostname}:8000`;
  }
};

export const API_BASE_URL = getApiUrl();

// Environment info
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const APP_ENV = process.env.REACT_APP_ENV || process.env.NODE_ENV;

// Log current configuration (only in development)
if (IS_DEVELOPMENT) {
  console.log('🔧 API Configuration:', {
    baseURL: API_BASE_URL,
    environment: APP_ENV,
    hostname: window.location.hostname
  });
}

export default {
  API_BASE_URL,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  APP_ENV
};
