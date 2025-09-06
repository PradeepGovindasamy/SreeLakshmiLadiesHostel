import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Drawer, List, ListItem, ListItemText, Box, Menu, MenuItem } from '@mui/material';
import { Dashboard as DashboardIcon, ExitToApp, Person } from '@mui/icons-material';
import { UserProvider, useUser } from './contexts/UserContext';
import ProtectedRoute from './components/ProtectedRoute';
import ConditionalDashboard from './components/ConditionalDashboard';
import { routeConfig, getNavigationItems, getPublicRoutes, getProtectedRoutes } from './config/routes';

const drawerWidth = 240;

function AppWrapper() {
  const { user, isAuthenticated, logout, getUserRole, getUserName } = useUser();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const userRole = getUserRole();

  // Get navigation items based on user role
  const navigationItems = getNavigationItems(userRole);

  return (
    <Box sx={{ display: 'flex' }}>
      {isAuthenticated() && (
        <>
          {/* Top AppBar */}
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Sree Lakshmi Ladies Hostel - {userRole?.toUpperCase()} Dashboard
              </Typography>
              
              {/* User Menu */}
              <Box display="flex" alignItems="center">
                <Typography variant="body2" sx={{ mr: 2 }}>
                  Welcome, {getUserName()}
                </Typography>
                <Button
                  color="inherit"
                  onClick={handleMenuClick}
                  startIcon={<Person />}
                >
                  Profile
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                    My Profile
                  </MenuItem>
                  <MenuItem onClick={() => { handleLogout(); handleMenuClose(); }}>
                    <ExitToApp sx={{ mr: 1 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </Box>
            </Toolbar>
          </AppBar>

          {/* Sidebar Drawer */}
          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
            }}
          >
            <Toolbar />
            <List>
              {navigationItems.map((item) => (
                <ListItem 
                  button 
                  component={Link} 
                  to={item.path}
                  key={item.path}
                >
                  <ListItemText primary={item.navLabel || item.title} />
                </ListItem>
              ))}
            </List>
          </Drawer>
        </>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginLeft: isAuthenticated() ? 0 : 0,
          width: isAuthenticated() ? `calc(100% - ${drawerWidth}px)` : '100%'
        }}
      >
        {isAuthenticated() && <Toolbar />}
        
        <Routes>
          {/* Public Routes */}
          {getPublicRoutes().map((route) => (
            <Route 
              key={route.path}
              path={route.path} 
              element={
                isAuthenticated() ? <ConditionalDashboard /> : <route.component />
              } 
            />
          ))}

          {/* Protected Routes */}
          {getProtectedRoutes().map((route) => (
            <Route 
              key={route.path}
              path={route.path} 
              element={
                <ProtectedRoute requiredRoles={route.requiredRoles}>
                  <route.component />
                </ProtectedRoute>
              } 
            />
          ))}

          {/* Fallback route */}
          <Route 
            path="*" 
            element={
              <ProtectedRoute>
                <ConditionalDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <UserProvider>
      <Router>
        <AppWrapper />
      </Router>
    </UserProvider>
  );
}

export default App;
