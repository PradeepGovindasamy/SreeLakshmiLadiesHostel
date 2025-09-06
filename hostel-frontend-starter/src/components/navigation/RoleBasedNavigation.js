import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Menu,
  MenuItem,
  Box,
  Chip,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  AccountBox as AccountBoxIcon,
  ExitToApp as ExitToAppIcon,
  Home as HomeIcon,
  Room as RoomIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { routeConfig, getNavigationItems } from '../../config/routes';

// Icon mapping for routes
const iconMap = {
  '/dashboard': <DashboardIcon />,
  '/branches': <BusinessIcon />,
  '/my-property': <HomeIcon />,
  '/rooms': <RoomIcon />,
  '/tenants': <GroupIcon />,
  '/profile': <PersonIcon />
};

const RoleBasedNavigation = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

  // Get navigation items based on user role
  const navigationItems = getNavigationItems(user?.role);

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    navigate('/login');
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const renderNavigationItems = (inDrawer = false) => {
    const items = navigationItems.map((item) => {
      const isActive = location.pathname === item.path;
      const icon = iconMap[item.path] || <DashboardIcon />;

      if (inDrawer) {
        return (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={isActive}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 1,
                mx: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive ? 'inherit' : 'text.secondary',
                  minWidth: 40,
                }}
              >
                {icon}
              </ListItemIcon>
              <ListItemText primary={item.navLabel} />
            </ListItemButton>
          </ListItem>
        );
      } else {
        return (
          <Button
            key={item.path}
            startIcon={icon}
            onClick={() => handleNavigation(item.path)}
            color={isActive ? 'primary' : 'inherit'}
            variant={isActive ? 'contained' : 'text'}
            sx={{ ml: 1 }}
          >
            {item.navLabel}
          </Button>
        );
      }
    });

    return items;
  };

  // Mobile drawer
  const drawer = (
    <Box sx={{ width: 280, height: '100%', bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" component="div" gutterBottom>
          Hostel Management
        </Typography>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBoxIcon color="primary" />
            <Box>
              <Typography variant="body2" fontWeight="bold">
                {user.name || user.username}
              </Typography>
              <Chip
                label={user.role?.toUpperCase()}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          </Box>
        )}
      </Box>
      
      <List sx={{ pt: 2 }}>
        {renderNavigationItems(true)}
      </List>
      
      <Box sx={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
        <Divider sx={{ mb: 2 }} />
        <Button
          fullWidth
          startIcon={<ExitToAppIcon />}
          onClick={handleLogout}
          color="error"
          variant="outlined"
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" color="primary" elevation={1}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: isMobile ? 1 : 0,
              cursor: 'pointer',
              mr: 3
            }}
            onClick={() => handleNavigation('/dashboard')}
          >
            Hostel Management
          </Typography>

          {!isMobile && (
            <Box sx={{ flexGrow: 1 }}>
              {renderNavigationItems()}
            </Box>
          )}

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {!isMobile && (
                <Chip
                  label={user.role?.toUpperCase()}
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{ mr: 1 }}
                />
              )}
              <Button
                color="inherit"
                startIcon={<AccountBoxIcon />}
                onClick={handleUserMenuOpen}
              >
                {isMobile ? '' : (user.name || user.username)}
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 },
        }}
      >
        {drawer}
      </Drawer>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { handleNavigation('/profile'); handleUserMenuClose(); }}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <ExitToAppIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

export default RoleBasedNavigation;
