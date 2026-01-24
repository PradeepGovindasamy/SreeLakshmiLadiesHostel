import apiClient from './client';
import { API_ENDPOINTS } from '../config/api';

export interface SendOTPRequest {
  phone_number: string;
}

export interface VerifyOTPRequest {
  phone_number: string;
  otp: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    phone_number: string;
    role: string;
  };
}

export const authAPI = {
  sendOTP: async (data: SendOTPRequest) => {
    const response = await apiClient.post(API_ENDPOINTS.SEND_OTP, data);
    return response.data;
  },

  verifyOTP: async (data: VerifyOTPRequest): Promise<AuthResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.VERIFY_OTP, data);
    return response.data;
  },
};
