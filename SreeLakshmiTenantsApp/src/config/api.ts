// API Configuration
export const API_CONFIG = {
  // For Android Emulator: use 10.0.2.2 instead of localhost
  // For Physical Device: use your machine's IP address (e.g., 192.168.x.x)
  // For iOS Simulator: localhost works fine
  BASE_URL: 'http://10.0.2.2:8000', // Android emulator -> host machine
  // BASE_URL: 'http://localhost:8000', // iOS simulator
  // BASE_URL: 'http://192.168.x.x:8000', // Physical device (replace with your IP)
  TIMEOUT: 30000,
};

export const API_ENDPOINTS = {
  // Authentication
  SEND_OTP: '/api/auth/send-otp/',
  VERIFY_OTP: '/api/auth/verify-otp/',
  
  // Properties & Rooms
  BRANCHES: '/api/v2/branches/',
  BRANCH_DETAIL: (id: number) => `/api/v2/branches/${id}/`,
  ROOMS: '/api/v2/rooms/',
  ROOM_DETAIL: (id: number) => `/api/v2/rooms/${id}/`,
  
  // Tenants
  TENANTS: '/api/v2/tenants/',
  TENANT_DETAIL: (id: number) => `/api/v2/tenants/${id}/`,
};
