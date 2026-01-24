// src/contexts/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('access');
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch user data and profile using new API
      const userResponse = await authAPI.getUser();
      setUser(userResponse.data);

      // Fetch user profile with role information
      const profileResponse = await authAPI.getProfile();
      setProfile(profileResponse.data);
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setError('Failed to fetch user profile');
      
      // If token is invalid, clear it
      if (err.response?.status === 401) {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        setUser(null);
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      // Use new enhanced login endpoint
      const response = await authAPI.login({ username, password });

      const { access, refresh, user: userData, profile: profileData } = response.data;
      
      // Store tokens
      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);

      // Set user and profile data from login response
      setUser(userData);
      setProfile(profileData);
      
      return { success: true };
    } catch (err) {
      console.error('Login failed:', err);
      return { 
        success: false, 
        error: err.response?.data?.detail || 'Login failed' 
      };
    }
  };

  // Firebase Phone OTP Login
  const phoneOTPLogin = (authData) => {
    try {
      const { access_token, refresh_token, user: userData, profile: profileData } = authData;
      
      // Store tokens
      localStorage.setItem('access', access_token);
      localStorage.setItem('refresh', refresh_token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userProfile', JSON.stringify(profileData));

      // Set user and profile data from OTP verification response
      setUser(userData);
      setProfile(profileData);
      
      return { success: true };
    } catch (err) {
      console.error('Phone OTP Login failed:', err);
      return { 
        success: false, 
        error: 'Phone OTP Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setUser(null);
    setProfile(null);
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem('access') && !!user;
  };

  const hasRole = (role) => {
    return profile?.role === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(profile?.role);
  };

  const getUserRole = () => {
    return profile?.role || 'guest';
  };

  const getUserName = () => {
    return user?.first_name && user?.last_name 
      ? `${user.first_name} ${user.last_name}`
      : user?.username || 'User';
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      setProfile(response.data);
      return { success: true };
    } catch (err) {
      console.error('Failed to update profile:', err);
      return { 
        success: false, 
        error: err.response?.data?.detail || 'Profile update failed' 
      };
    }
  };

  const getBranchInfo = () => {
    return {
      id: profile?.branch_id,
      name: profile?.branch_name,
    };
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const value = {
    user,
    profile,
    loading,
    error,
    login,
    phoneOTPLogin,
    logout,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    getUserRole,
    getUserName,
    updateProfile,
    getBranchInfo,
    refreshProfile: fetchUserProfile
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
