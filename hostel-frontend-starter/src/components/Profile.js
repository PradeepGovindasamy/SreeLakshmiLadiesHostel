import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  AccountCircle as AccountIcon
} from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';
import UserProfileForm from './UserProfileForm';

function Profile() {
  const [profileFormOpen, setProfileFormOpen] = useState(false);
  const { user, getUserRole } = useUser();
  const userRole = getUserRole();

  const handleOpenProfileForm = () => {
    setProfileFormOpen(true);
  };

  const handleCloseProfileForm = () => {
    setProfileFormOpen(false);
  };

  const handleProfileUpdate = () => {
    // Profile will be automatically updated through context
    console.log('Profile updated successfully');
  };

  const getInitials = (user) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
    }
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = (user) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || 'User';
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Profile not available
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>

      {/* Profile Summary Card */}
      <Card elevation={0} sx={{ mb: 3, border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        {/* Gradient banner */}
        <Box sx={{
          height: 120,
          background: userRole === 'admin' ? 'linear-gradient(135deg, #5b21b6, #7c3aed)' :
                      userRole === 'owner' ? 'linear-gradient(135deg, #1e40af, #3b82f6)' :
                      userRole === 'warden' ? 'linear-gradient(135deg, #0c4a6e, #0891b2)' :
                      'linear-gradient(135deg, #065f46, #059669)',
          position: 'relative',
        }}>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleOpenProfileForm}
            size="small"
            sx={{
              position: 'absolute', top: 12, right: 12,
              backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
              color: '#fff', fontWeight: 600, borderRadius: 2,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' },
            }}
          >
            Edit Profile
          </Button>
        </Box>
        <CardContent sx={{ pt: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mt: -5, mb: 1, flexWrap: 'wrap' }}>
            <Avatar
              sx={{
                width: 96, height: 96, fontSize: 36, fontWeight: 800,
                bgcolor: userRole === 'admin' ? '#7c3aed' :
                         userRole === 'owner' ? '#1d4ed8' :
                         userRole === 'warden' ? '#0891b2' : '#059669',
                border: '4px solid #fff',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              }}
              src={user.avatar}
            >
              {getInitials(user)}
            </Avatar>
            <Box sx={{ pb: 1, flexGrow: 1 }}>
              <Typography variant="h5" fontWeight={800}>{getDisplayName(user)}</Typography>
              <Typography variant="body2" color="text.secondary">{user.email}</Typography>
            </Box>
            <Box sx={{ pb: 1, display: 'flex', gap: 1 }}>
              <Chip
                label={userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}
                size="small"
                sx={{
                  fontWeight: 700,
                  backgroundColor: userRole === 'admin' ? '#ede9fe' :
                                   userRole === 'owner' ? '#dbeafe' :
                                   userRole === 'warden' ? '#e0f2fe' : '#dcfce7',
                  color: userRole === 'admin' ? '#6d28d9' :
                         userRole === 'owner' ? '#1d4ed8' :
                         userRole === 'warden' ? '#0369a1' : '#15803d',
                }}
              />
              <Chip
                label={user.is_active ? 'Active' : 'Inactive'}
                color={user.is_active ? 'success' : 'error'}
                size="small"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Contact Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1 }} />
                Contact Information
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={user.email || 'Not provided'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Phone"
                    secondary={user.phone || 'Not provided'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <HomeIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Address"
                    secondary={user.address || 'Not provided'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountIcon sx={{ mr: 1 }} />
                Account Details
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Username"
                    secondary={user.username}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Account Type"
                    secondary={userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Member Since"
                    secondary={user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'Unknown'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Last Login"
                    secondary={user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Additional Information */}
        {user.bio && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  About
                </Typography>
                <Typography variant="body1">
                  {user.bio}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Emergency Contact */}
        {(user.emergency_contact || user.emergency_relation) && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Emergency Contact
                </Typography>
                <Grid container spacing={2}>
                  {user.emergency_contact && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Contact</Typography>
                      <Typography variant="body1">{user.emergency_contact}</Typography>
                    </Grid>
                  )}
                  {user.emergency_relation && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Relation</Typography>
                      <Typography variant="body1">{user.emergency_relation}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Preferences */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preferences
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">Language</Typography>
                  <Typography variant="body1">{user.language || 'English'}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">Theme</Typography>
                  <Typography variant="body1">{user.theme || 'Light'}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">Timezone</Typography>
                  <Typography variant="body1">{user.timezone || 'Asia/Kolkata'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* User Profile Form Dialog */}
      <UserProfileForm
        open={profileFormOpen}
        onClose={handleCloseProfileForm}
        onUpdate={handleProfileUpdate}
      />
    </Container>
  );
}

export default Profile;
