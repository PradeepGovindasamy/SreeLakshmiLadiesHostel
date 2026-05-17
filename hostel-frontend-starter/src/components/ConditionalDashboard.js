// src/components/ConditionalDashboard.js
import React from 'react';
import { Box, Alert, CircularProgress, Typography, Button } from '@mui/material';
import { useUser } from '../contexts/UserContext';
import OwnerDashboard from './dashboards/OwnerDashboard';
import WardenDashboard from './dashboards/WardenDashboard';
import TenantDashboard from './dashboards/TenantDashboard';

const ConditionalDashboard = () => {
  const { user, profile, loading, error, getUserRole, refreshProfile } = useUser();

  if (loading) {
    return (
      <Box sx={{
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        minHeight: '60vh', gap: 2,
      }}>
        <CircularProgress size={40} thickness={4} />
        <Typography variant="body2" color="text.secondary">Loading your dashboard…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, maxWidth: 520 }}>
        <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
          {error}
        </Alert>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={refreshProfile}>
            Retry
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              localStorage.removeItem('access');
              localStorage.removeItem('refresh');
              window.location.href = '/login';
            }}
          >
            Log in again
          </Button>
        </Box>
      </Box>
    );
  }

  if (!user || !profile) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          User profile not found. Please log in again.
        </Alert>
      </Box>
    );
  }

  const userRole = getUserRole();

  switch (userRole) {
    case 'owner':
    case 'admin':
      return <OwnerDashboard />;
    case 'warden':
      return <WardenDashboard />;
    case 'tenant':
      return <TenantDashboard />;
    default:
      return (
        <Box sx={{ p: 4 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Unknown user role: "{userRole}". Please contact support.
          </Alert>
        </Box>
      );
  }
};

export default ConditionalDashboard;
