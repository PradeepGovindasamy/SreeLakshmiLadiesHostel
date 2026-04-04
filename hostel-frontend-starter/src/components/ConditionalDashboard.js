// src/components/ConditionalDashboard.js
import React from 'react';
import { Box, Alert, CircularProgress } from '@mui/material';
import { useUser } from '../contexts/UserContext';
import OwnerDashboard from './dashboards/OwnerDashboard';
import WardenDashboard from './dashboards/WardenDashboard';
import TenantDashboard from './dashboards/TenantDashboard';

const ConditionalDashboard = () => {
  const { user, profile, loading, error, getUserRole } = useUser();

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        flexDirection="column"
      >
        <CircularProgress size={50} />
        <Box mt={2}>Loading your dashboard...</Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load dashboard: {error}
        </Alert>
      </Box>
    );
  }

  if (!user || !profile) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          User profile not found. Please log in again.
        </Alert>
      </Box>
    );
  }

  const userRole = getUserRole();

  // Render dashboard based on user role
  const renderDashboard = () => {
    switch (userRole) {
      case 'owner':
        return <OwnerDashboard />;
      
      case 'warden':
        return <WardenDashboard />;
      
      case 'tenant':
        return <TenantDashboard />;
      
      case 'admin':
        // Admins get owner dashboard with full access
        return <OwnerDashboard />;
      
      default:
        return (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">
              Unknown user role: "{userRole}". Please contact support.
            </Alert>
          </Box>
        );
    }
  };

  return (
    <Box>
      {renderDashboard()}
    </Box>
  );
};

export default ConditionalDashboard;
