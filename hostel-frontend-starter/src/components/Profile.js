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
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}
              src={user.avatar}
            >
              {getInitials(user)}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" gutterBottom>
                {getDisplayName(user)}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  label={userRole?.toUpperCase()}
                  color="primary"
                  size="small"
                />
                <Chip
                  label={user.is_active ? 'Active' : 'Inactive'}
                  color={user.is_active ? 'success' : 'error'}
                  size="small"
                />
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleOpenProfileForm}
            >
              Edit Profile
            </Button>
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
