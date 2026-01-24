import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authAPI, AuthResponse } from '../api/auth';
import { saveAuthToken, getAuthToken, saveUserData, getUserData, clearStorage } from '../utils/storage';

interface AuthContextData {
  user: any | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (phoneNumber: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  sendOTP: (phoneNumber: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await getAuthToken();
      const userData = await getUserData();
      
      if (token && userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async (phoneNumber: string) => {
    try {
      await authAPI.sendOTP({ phone_number: phoneNumber });
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  };

  const login = async (phoneNumber: string, otp: string) => {
    try {
      const response: AuthResponse = await authAPI.verifyOTP({
        phone_number: phoneNumber,
        otp: otp,
      });

      await saveAuthToken(response.token);
      await saveUserData(response.user);
      setUser(response.user);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await clearStorage();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        sendOTP,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
