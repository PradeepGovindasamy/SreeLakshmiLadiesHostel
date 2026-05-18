import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Box, Menu, MenuItem, Avatar,
  Drawer, List, ListItem, Divider,
  IconButton, Tooltip, Chip, CircularProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon, ExitToApp, Person,
  Business, MeetingRoom, People, SensorDoor, Inventory2,
  PrecisionManufacturing, Engineering, ManageAccounts, Home
} from '@mui/icons-material';
import { UserProvider, useUser } from './contexts/UserContext';
import ProtectedRoute from './components/ProtectedRoute';
import ConditionalDashboard from './components/ConditionalDashboard';
import { routeConfig, getNavigationItems, getPublicRoutes, getProtectedRoutes } from './config/routes';

const drawerWidth = 256;

// Map nav labels to icons
const NAV_ICONS = {
  'Dashboard':        <DashboardIcon fontSize="small" />,
  'Properties':       <Business fontSize="small" />,
  'Rooms':            <MeetingRoom fontSize="small" />,
  'Tenants':          <People fontSize="small" />,
  'Room Status':      <SensorDoor fontSize="small" />,
  'Groceries':        <Inventory2 fontSize="small" />,
  'Machines':         <PrecisionManufacturing fontSize="small" />,
  'Workers':          <Engineering fontSize="small" />,
  'User Management':  <ManageAccounts fontSize="small" />,
};

const ROLE_COLORS = {
  admin:  '#7c3aed',
  owner:  '#1d4ed8',
  warden: '#0891b2',
  tenant: '#059669',
};

function AppWrapper() {
  const { user, isAuthenticated, logout, getUserRole, getUserName, loading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleLogout = () => { logout(); navigate('/'); };
  const userRole = getUserRole();
  const navigationItems = getNavigationItems(userRole);

  const isPublicPage =
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/password-reset/confirm';

  const hasToken = !!localStorage.getItem('access');

  // While auth is being verified and the user has a cached token, show a full-page
  // spinner on auth-only pages (/login etc.) to prevent the login form from flashing
  // before the redirect to the dashboard.
  if (loading && hasToken && isPublicPage && location.pathname !== '/') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f8fafc', gap: 2 }}>
        <CircularProgress size={40} thickness={4} />
        <Typography variant="body2" color="text.secondary">Loading your session…</Typography>
      </Box>
    );
  }

  const showLayout = isAuthenticated() && !isPublicPage;
  const roleColor = ROLE_COLORS[userRole] || '#1d4ed8';
  const initials = getUserName()?.slice(0, 2).toUpperCase() || 'U';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {showLayout && (
        <>
          {/* ── Sidebar ── */}
          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
                backgroundColor: '#0f172a',
                color: '#e2e8f0',
                borderRight: 'none',
              },
            }}
          >
            {/* Brand */}
            <Box sx={{ px: 3, py: 3, borderBottom: '1px solid #1e293b' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: 2,
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Home sx={{ fontSize: 18, color: '#fff' }} />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={700} color="#f1f5f9" lineHeight={1.2}>
                    Sree Lakshmi
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Hostel Manager
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Role badge */}
            <Box sx={{ px: 3, py: 1.5, borderBottom: '1px solid #1e293b' }}>
              {loading ? (
                <Box sx={{ height: 22, width: 64, borderRadius: 1, backgroundColor: '#1e293b' }} />
              ) : (
                <Chip
                  label={userRole?.toUpperCase()}
                  size="small"
                  sx={{
                    backgroundColor: `${roleColor}22`,
                    color: roleColor,
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: 1,
                    border: `1px solid ${roleColor}44`,
                  }}
                />
              )}
            </Box>

            {/* Nav items */}
            <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5 }}>
              {loading ? (
                // Skeleton placeholders while role/profile is being fetched
                Array.from({ length: 6 }).map((_, i) => (
                  <Box
                    key={i}
                    sx={{
                      mx: 1.5, mb: 0.5, height: 40, borderRadius: 2,
                      backgroundColor: '#1e293b',
                      animation: 'pulse 1.5s ease-in-out infinite',
                      opacity: 0.6 - i * 0.07,
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 0.6 - i * 0.07 },
                        '50%': { opacity: 0.3 - i * 0.03 },
                      },
                    }}
                  />
                ))
              ) : (
                <List dense disablePadding>
                  {navigationItems.map((item) => {
                    const label = item.navLabel || item.title;
                    const isActive = location.pathname === item.path;
                    return (
                      <ListItem
                        key={item.path}
                        component={NavLink}
                        to={item.path}
                        disablePadding
                        sx={{
                          display: 'block',
                          mx: 1.5,
                          mb: 0.5,
                          borderRadius: 2,
                          overflow: 'hidden',
                          backgroundColor: isActive ? '#1e40af' : 'transparent',
                          '&:hover': { backgroundColor: isActive ? '#1e40af' : '#1e293b' },
                          textDecoration: 'none',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25 }}>
                          <Box sx={{ color: isActive ? '#93c5fd' : '#64748b', display: 'flex' }}>
                            {NAV_ICONS[label] || <DashboardIcon fontSize="small" />}
                          </Box>
                          <Typography
                            variant="body2"
                            fontWeight={isActive ? 600 : 400}
                            color={isActive ? '#f1f5f9' : '#94a3b8'}
                          >
                            {label}
                          </Typography>
                          {isActive && (
                            <Box sx={{ ml: 'auto', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                          )}
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Box>

            {/* User footer */}
            <Box sx={{ borderTop: '1px solid #1e293b', px: 2, py: 2 }}>
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#1e293b', flexShrink: 0 }} />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ height: 12, borderRadius: 1, backgroundColor: '#1e293b', mb: 0.5 }} />
                    <Box sx={{ height: 10, borderRadius: 1, backgroundColor: '#1e293b', width: '60%' }} />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ width: 32, height: 32, backgroundColor: roleColor, fontSize: 13, fontWeight: 700 }}>
                    {initials}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} color="#f1f5f9" noWrap>
                      {getUserName()}
                    </Typography>
                    <Typography variant="caption" color="#64748b" noWrap>
                      {userRole}
                    </Typography>
                  </Box>
                  <Tooltip title="Logout">
                    <IconButton size="small" onClick={handleLogout} sx={{ color: '#64748b', '&:hover': { color: '#ef4444' } }}>
                      <ExitToApp fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
          </Drawer>

          {/* ── Top AppBar ── */}
          <AppBar
            position="fixed"
            elevation={0}
            sx={{
              width: `calc(100% - ${drawerWidth}px)`,
              ml: `${drawerWidth}px`,
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              color: '#0f172a',
            }}
          >
            <Toolbar sx={{ minHeight: '60px !important' }}>
              {/* Page title derived from route */}
              <Typography variant="subtitle1" fontWeight={600} color="grey.800" sx={{ flexGrow: 1 }}>
                {navigationItems.find(n => n.path === location.pathname)?.navLabel ||
                 navigationItems.find(n => n.path === location.pathname)?.title ||
                 'Dashboard'}
              </Typography>

              {/* Right: avatar + menu */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Account">
                  <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                    <Avatar sx={{ width: 32, height: 32, backgroundColor: roleColor, fontSize: 13, fontWeight: 700 }}>
                      {initials}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }}>
                    <Person fontSize="small" sx={{ mr: 1 }} /> My Profile
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={() => { handleLogout(); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
                    <ExitToApp fontSize="small" sx={{ mr: 1 }} /> Logout
                  </MenuItem>
                </Menu>
              </Box>
            </Toolbar>
          </AppBar>
        </>
      )}

      {/* ── Main Content ── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          pt: showLayout ? '60px' : 0,
          backgroundColor: '#f8fafc',
        }}
      >
        <Routes>
          {getPublicRoutes().map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                isAuthenticated() && route.path !== '/'
                  ? <Navigate to="/dashboard" replace />
                  : <route.component />
              }
            />
          ))}
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
          <Route path="*" element={<ProtectedRoute><ConditionalDashboard /></ProtectedRoute>} />
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
