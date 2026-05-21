import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Box, Menu, MenuItem, Avatar,
  Drawer, List, ListItem, Divider,
  IconButton, Tooltip, Chip, CircularProgress, useMediaQuery, useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon, ExitToApp, Person, Menu as MenuIcon,
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
  const theme = useTheme();
  const isTabletDown = useMediaQuery(theme.breakpoints.down('lg'));
  const { user, isAuthenticated, logout, getUserRole, getUserName, loading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);

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

  React.useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const drawerContent = (
    <>
      {/* Brand */}
      <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: 2,
            bgcolor: 'rgba(99, 102, 241, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Home sx={{ fontSize: 17, color: '#a5b4fc' }} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={600} color="#f8fafc" lineHeight={1.2}>
              Sree Lakshmi
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Hostel Manager
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Role badge */}
      <Box sx={{ px: 3, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {loading ? (
          <Box sx={{ height: 22, width: 64, borderRadius: 1, backgroundColor: '#1e293b' }} />
        ) : (
          <Chip
            label={userRole?.toUpperCase()}
            size="small"
            sx={{
              backgroundColor: `${roleColor}18`,
              color: roleColor,
              fontWeight: 600,
              fontSize: 10,
              letterSpacing: 0.8,
              border: 'none',
            }}
          />
        )}
      </Box>

      {/* Nav items */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5 }}>
        {loading ? (
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
                  onClick={() => isTabletDown && setMobileOpen(false)}
                  sx={{
                    display: 'block',
                    mx: 1.5,
                    mb: 0.5,
                    borderRadius: 2,
                    overflow: 'hidden',
                    backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    '&:hover': { backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.04)' },
                    textDecoration: 'none',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.15 }}>
                    <Box sx={{ color: isActive ? '#a5b4fc' : '#64748b', display: 'flex' }}>
                      {NAV_ICONS[label] || <DashboardIcon fontSize="small" />}
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight={isActive ? 600 : 400}
                      color={isActive ? '#f1f5f9' : '#94a3b8'}
                    >
                      {label}
                    </Typography>
                  </Box>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>

      {/* User footer */}
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)', px: 2, py: 2 }}>
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
    </>
  );

  const drawerPaperSx = {
    width: drawerWidth,
    boxSizing: 'border-box',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    borderRight: 'none',
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {showLayout && (
        <>
          {/* ── Sidebar ── */}
          <Drawer
            variant={isTabletDown ? 'temporary' : 'permanent'}
            open={isTabletDown ? mobileOpen : true}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': drawerPaperSx,
            }}
          >
            {drawerContent}
          </Drawer>

          {/* ── Top AppBar ── */}
          <AppBar
            position="fixed"
            elevation={0}
            sx={{
              width: isTabletDown ? '100%' : `calc(100% - ${drawerWidth}px)`,
              ml: isTabletDown ? 0 : `${drawerWidth}px`,
              backgroundColor: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(8px)',
              borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
              color: '#0f172a',
            }}
          >
            <Toolbar sx={{ minHeight: { xs: '52px !important', sm: '56px !important' }, px: { xs: 1.5, sm: 2 } }}>
              {isTabletDown && (
                <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1, color: '#64748b' }}>
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="subtitle1" fontWeight={600} color="grey.800" sx={{ flexGrow: 1, fontSize: { xs: '0.95rem', sm: '1rem' } }}>
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
          pt: showLayout ? { xs: '52px', sm: '56px' } : 0,
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
