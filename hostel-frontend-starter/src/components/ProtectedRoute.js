// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useUser } from '../contexts/UserContext';

const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  fallbackPath = '/dashboard',
  showError = true 
}) => {
  const { user, profile, loading, isAuthenticated, getUserRole } = useUser();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  // Check if user has required role
  const userRole = getUserRole();
  const hasPermission = requiredRoles.length === 0 || requiredRoles.includes(userRole);

  if (!hasPermission) {
    if (!showError) {
      return <Navigate to={fallbackPath} replace />;
    }

    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. You don't have permission to view this page.
          <br />
          Required roles: {requiredRoles.join(', ')}
          <br />
          Your role: {userRole}
        </Alert>
      </Box>
    );
  }

  return children;
};

export default ProtectedRoute;
