import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { UserProvider, useUser } from './contexts/UserContext';
import LoginForm from './components/LoginForm';
import ProtectedRoute from './components/ProtectedRoute';
import ConditionalDashboard from './components/ConditionalDashboard';
import RoleBasedNavigation from './components/navigation/RoleBasedNavigation';
import Branches from './components/Branches';
import RoleFilteredBranches from './components/RoleFilteredBranches';
import Rooms from './components/Rooms';
import Tenants from './components/Tenants';
import RoleTestPage from './components/RoleTestPage';
import { routeConfig } from './config/routes';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    h6: {
      fontWeight: 600,
    },
  },
});

// Main App Content
function AppContent() {
  const { isAuthenticated } = useUser();

  if (!isAuthenticated()) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <LoginForm />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <RoleBasedNavigation />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          bgcolor: 'background.default',
        }}
      >
        <Routes>
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Dashboard Route - Conditional based on role */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRoles={['owner', 'warden', 'tenant']}>
                <ConditionalDashboard />
              </ProtectedRoute>
            }
          />

          {/* Owner Routes */}
          <Route
            path="/branches"
            element={
              <ProtectedRoute requiredRoles={['owner']}>
                <Branches />
              </ProtectedRoute>
            }
          />

          {/* Warden Routes */}
          <Route
            path="/my-property"
            element={
              <ProtectedRoute requiredRoles={['warden']}>
                <RoleFilteredBranches />
              </ProtectedRoute>
            }
          />

          {/* Shared Routes (Owner & Warden) */}
          <Route
            path="/rooms"
            element={
              <ProtectedRoute requiredRoles={['owner', 'warden']}>
                <Rooms />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tenants"
            element={
              <ProtectedRoute requiredRoles={['owner', 'warden']}>
                <Tenants />
              </ProtectedRoute>
            }
          />

          {/* Profile Route - Available to all authenticated users */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute requiredRoles={['owner', 'warden', 'tenant']}>
                <Box sx={{ p: 2 }}>
                  <h2>User Profile</h2>
                  <p>Profile management coming soon...</p>
                </Box>
              </ProtectedRoute>
            }
          />

          {/* Test Route - For demonstration */}
          <Route
            path="/test-roles"
            element={
              <ProtectedRoute requiredRoles={['owner', 'warden', 'tenant']}>
                <RoleTestPage />
              </ProtectedRoute>
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}

// Main App Component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
