import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Chip
} from '@mui/material';
import { AccessTime, ExitToApp, Refresh } from '@mui/icons-material';
import axios from 'axios';

const SessionManager = () => {
  const [sessionInfo, setSessionInfo] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const API_BASE_URL = 'http://127.0.0.1:8000/api';

  // Decode JWT token to get expiry information
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Get session information
  const getSessionInfo = () => {
    const accessToken = localStorage.getItem('access');
    const refreshToken = localStorage.getItem('refresh');
    
    if (!accessToken || !refreshToken) {
      return null;
    }

    const accessPayload = decodeToken(accessToken);
    const refreshPayload = decodeToken(refreshToken);

    if (!accessPayload || !refreshPayload) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const accessExpiry = accessPayload.exp;
    const refreshExpiry = refreshPayload.exp;

    return {
      accessExpiry: accessExpiry * 1000, // Convert to milliseconds
      refreshExpiry: refreshExpiry * 1000,
      accessTimeLeft: Math.max(0, accessExpiry - now),
      refreshTimeLeft: Math.max(0, refreshExpiry - now),
      isAccessExpired: accessExpiry <= now,
      isRefreshExpired: refreshExpiry <= now,
      userId: accessPayload.user_id
    };
  };

  // Refresh access token
  const refreshAccessToken = async () => {
    setRefreshing(true);
    try {
      const refreshToken = localStorage.getItem('refresh');
      const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
        refresh: refreshToken
      });

      if (response.data.access) {
        localStorage.setItem('access', response.data.access);
        if (response.data.refresh) {
          localStorage.setItem('refresh', response.data.refresh);
        }
        console.log('Token refreshed successfully');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      window.location.reload();
    } finally {
      setRefreshing(false);
    }
  };

  // Format time remaining
  const formatTimeLeft = (seconds) => {
    if (seconds <= 0) return 'Expired';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  // Update session info every second
  useEffect(() => {
    const updateSessionInfo = () => {
      const info = getSessionInfo();
      setSessionInfo(info);
      
      if (info && !info.isRefreshExpired) {
        setTimeLeft(info.accessTimeLeft);
        
        // Auto-refresh token when access token expires
        if (info.isAccessExpired && !refreshing) {
          refreshAccessToken();
        }
      }
    };

    updateSessionInfo();
    const interval = setInterval(updateSessionInfo, 1000);

    return () => clearInterval(interval);
  }, [refreshing]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    localStorage.removeItem('userProfile');
    window.location.reload();
  };

  if (!sessionInfo) {
    return null; // No session to display
  }

  if (sessionInfo.isRefreshExpired) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={handleLogout}>
          Login Again
        </Button>
      }>
        Session expired. Please login again.
      </Alert>
    );
  }

  const accessProgress = sessionInfo.accessTimeLeft > 0 
    ? (sessionInfo.accessTimeLeft / (30 * 60)) * 100 // 30 minutes = 1800 seconds
    : 0;

  const refreshProgress = sessionInfo.refreshTimeLeft > 0 
    ? (sessionInfo.refreshTimeLeft / (30 * 24 * 60 * 60)) * 100 // 30 days
    : 0;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" display="flex" alignItems="center" gap={1}>
            <AccessTime /> Session Status
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              size="small"
              onClick={refreshAccessToken}
              disabled={refreshing}
              startIcon={refreshing ? null : <Refresh />}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              size="small"
              color="error"
              onClick={handleLogout}
              startIcon={<ExitToApp />}
            >
              Logout
            </Button>
          </Box>
        </Box>

        {/* Access Token Status */}
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2">
              Access Token {sessionInfo.isAccessExpired ? 
                <Chip label="Expired" color="error" size="small" /> :
                <Chip label="Active" color="success" size="small" />
              }
            </Typography>
            <Typography variant="body2">
              {formatTimeLeft(sessionInfo.accessTimeLeft)}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={accessProgress} 
            color={sessionInfo.isAccessExpired ? "error" : "primary"}
          />
        </Box>

        {/* Refresh Token Status */}
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2">
              Session Valid Until
            </Typography>
            <Typography variant="body2">
              {formatTimeLeft(sessionInfo.refreshTimeLeft)}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={refreshProgress} 
            color="secondary"
          />
        </Box>

        {sessionInfo.refreshTimeLeft < 24 * 60 * 60 && ( // Less than 1 day
          <Alert severity="warning" sx={{ mt: 2 }}>
            Your session will expire soon. Please save your work.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionManager;
