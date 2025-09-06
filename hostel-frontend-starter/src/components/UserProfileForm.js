import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon
} from '@mui/icons-material';
import { userAPI, authAPI } from '../api';
import { useUser } from '../contexts/UserContext';

function UserProfileForm({ open, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { user, updateUser } = useUser();

  const [profileData, setProfileData] = useState({
    // Basic Information
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    
    // Profile Details
    bio: '',
    avatar: null,
    
    // Contact Information
    address: '',
    city: '',
    state: '',
    pincode: '',
    emergency_contact: '',
    emergency_relation: '',
    
    // Preferences
    language: 'en',
    timezone: 'Asia/Kolkata',
    theme: 'light',
    
    // Notification Preferences
    email_notifications: true,
    sms_notifications: true,
    marketing_emails: false,
    security_alerts: true,
    
    // Privacy Settings
    profile_visibility: 'private',
    show_email: false,
    show_phone: false
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const tabs = [
    { label: 'Personal Info', icon: <PersonIcon /> },
    { label: 'Account Security', icon: <SecurityIcon /> },
    { label: 'Notifications', icon: <NotificationsIcon /> },
    { label: 'Profile Settings', icon: <AccountIcon /> }
  ];

  useEffect(() => {
    if (open && user) {
      fetchUserProfile();
    }
  }, [open, user]);

  const fetchUserProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      const userData = response.data;
      
      setProfileData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        date_of_birth: userData.date_of_birth || '',
        gender: userData.gender || '',
        bio: userData.bio || '',
        avatar: userData.avatar || null,
        address: userData.address || '',
        city: userData.city || '',
        state: userData.state || '',
        pincode: userData.pincode || '',
        emergency_contact: userData.emergency_contact || '',
        emergency_relation: userData.emergency_relation || '',
        language: userData.language || 'en',
        timezone: userData.timezone || 'Asia/Kolkata',
        theme: userData.theme || 'light',
        email_notifications: userData.email_notifications !== false,
        sms_notifications: userData.sms_notifications !== false,
        marketing_emails: userData.marketing_emails || false,
        security_alerts: userData.security_alerts !== false,
        profile_visibility: userData.profile_visibility || 'private',
        show_email: userData.show_email || false,
        show_phone: userData.show_phone || false
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load profile information');
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleEditMode = (section) => {
    setEditMode(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
    setError('');
    setSuccess('');
  };

  const validatePassword = () => {
    if (!passwordData.current_password) {
      setError('Current password is required');
      return false;
    }
    if (!passwordData.new_password) {
      setError('New password is required');
      return false;
    }
    if (passwordData.new_password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      return false;
    }
    return true;
  };

  const handleSaveSection = async (section) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (section === 'password') {
        if (!validatePassword()) {
          setLoading(false);
          return;
        }
        
        await authAPI.changePassword({
          old_password: passwordData.current_password,
          new_password: passwordData.new_password
        });
        
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
        setSuccess('Password updated successfully');
      } else {
        const updateData = {};
        
        if (section === 'basic') {
          updateData.first_name = profileData.first_name;
          updateData.last_name = profileData.last_name;
          updateData.phone = profileData.phone;
          updateData.date_of_birth = profileData.date_of_birth;
          updateData.gender = profileData.gender;
          updateData.bio = profileData.bio;
        } else if (section === 'contact') {
          updateData.address = profileData.address;
          updateData.city = profileData.city;
          updateData.state = profileData.state;
          updateData.pincode = profileData.pincode;
          updateData.emergency_contact = profileData.emergency_contact;
          updateData.emergency_relation = profileData.emergency_relation;
        } else if (section === 'notifications') {
          updateData.email_notifications = profileData.email_notifications;
          updateData.sms_notifications = profileData.sms_notifications;
          updateData.marketing_emails = profileData.marketing_emails;
          updateData.security_alerts = profileData.security_alerts;
        } else if (section === 'privacy') {
          updateData.profile_visibility = profileData.profile_visibility;
          updateData.show_email = profileData.show_email;
          updateData.show_phone = profileData.show_phone;
          updateData.language = profileData.language;
          updateData.timezone = profileData.timezone;
          updateData.theme = profileData.theme;
        }

        const response = await userAPI.updateProfile(updateData);
        updateUser(response.data);
        setSuccess('Profile updated successfully');
      }

      setEditMode(prev => ({
        ...prev,
        [section]: false
      }));

      if (onUpdate) {
        onUpdate();
      }

    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const renderPersonalInfo = () => (
    <Box>
      {/* Avatar Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar
          src={profileData.avatar}
          sx={{ width: 80, height: 80, mr: 2 }}
        >
          {profileData.first_name?.charAt(0)}{profileData.last_name?.charAt(0)}
        </Avatar>
        <Box>
          <Typography variant="h6">
            {profileData.first_name} {profileData.last_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.role}
          </Typography>
          <Chip
            label={user?.is_active ? 'Active' : 'Inactive'}
            color={user?.is_active ? 'success' : 'error'}
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Basic Information */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Basic Information</Typography>
            <IconButton onClick={() => toggleEditMode('basic')}>
              {editMode.basic ? <CancelIcon /> : <EditIcon />}
            </IconButton>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={profileData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                disabled={!editMode.basic}
                variant={editMode.basic ? 'outlined' : 'standard'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={profileData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                disabled={!editMode.basic}
                variant={editMode.basic ? 'outlined' : 'standard'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                value={profileData.email}
                disabled={true}
                variant="standard"
                helperText="Email cannot be changed"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={profileData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!editMode.basic}
                variant={editMode.basic ? 'outlined' : 'standard'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={profileData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                disabled={!editMode.basic}
                variant={editMode.basic ? 'outlined' : 'standard'}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!editMode.basic}>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={profileData.gender}
                  label="Gender"
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  variant={editMode.basic ? 'outlined' : 'standard'}
                >
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                multiline
                rows={3}
                value={profileData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                disabled={!editMode.basic}
                variant={editMode.basic ? 'outlined' : 'standard'}
                placeholder="Tell us about yourself..."
              />
            </Grid>
          </Grid>

          {editMode.basic && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSection('basic')}
                disabled={loading}
              >
                Save Changes
              </Button>
              <Button
                variant="outlined"
                onClick={() => toggleEditMode('basic')}
              >
                Cancel
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Contact Information</Typography>
            <IconButton onClick={() => toggleEditMode('contact')}>
              {editMode.contact ? <CancelIcon /> : <EditIcon />}
            </IconButton>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={profileData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={!editMode.contact}
                variant={editMode.contact ? 'outlined' : 'standard'}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                value={profileData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                disabled={!editMode.contact}
                variant={editMode.contact ? 'outlined' : 'standard'}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                value={profileData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                disabled={!editMode.contact}
                variant={editMode.contact ? 'outlined' : 'standard'}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Pincode"
                value={profileData.pincode}
                onChange={(e) => handleInputChange('pincode', e.target.value)}
                disabled={!editMode.contact}
                variant={editMode.contact ? 'outlined' : 'standard'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact"
                value={profileData.emergency_contact}
                onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                disabled={!editMode.contact}
                variant={editMode.contact ? 'outlined' : 'standard'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Relation"
                value={profileData.emergency_relation}
                onChange={(e) => handleInputChange('emergency_relation', e.target.value)}
                disabled={!editMode.contact}
                variant={editMode.contact ? 'outlined' : 'standard'}
              />
            </Grid>
          </Grid>

          {editMode.contact && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSection('contact')}
                disabled={loading}
              >
                Save Changes
              </Button>
              <Button
                variant="outlined"
                onClick={() => toggleEditMode('contact')}
              >
                Cancel
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );

  const renderAccountSecurity = () => (
    <Box>
      {/* Password Change */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Change Password
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Password"
                type={showPassword ? 'text' : 'password'}
                value={passwordData.current_password}
                onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={passwordData.new_password}
                onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                helperText="Minimum 8 characters"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => handleSaveSection('password')}
              disabled={loading}
            >
              Update Password
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Account Information
          </Typography>
          
          <List>
            <ListItem>
              <ListItemText
                primary="Account Status"
                secondary={user?.is_active ? 'Active' : 'Inactive'}
              />
              <Chip
                label={user?.is_active ? 'Active' : 'Inactive'}
                color={user?.is_active ? 'success' : 'error'}
                size="small"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Account Type"
                secondary={user?.role}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Member Since"
                secondary={user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Last Login"
                secondary={user?.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );

  const renderNotifications = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Notification Preferences</Typography>
          <IconButton onClick={() => toggleEditMode('notifications')}>
            {editMode.notifications ? <CancelIcon /> : <EditIcon />}
          </IconButton>
        </Box>

        <List>
          <ListItem>
            <ListItemText
              primary="Email Notifications"
              secondary="Receive notifications via email"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={profileData.email_notifications}
                onChange={(e) => handleInputChange('email_notifications', e.target.checked)}
                disabled={!editMode.notifications}
              />
            </ListItemSecondaryAction>
          </ListItem>
          <ListItem>
            <ListItemText
              primary="SMS Notifications"
              secondary="Receive notifications via SMS"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={profileData.sms_notifications}
                onChange={(e) => handleInputChange('sms_notifications', e.target.checked)}
                disabled={!editMode.notifications}
              />
            </ListItemSecondaryAction>
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Security Alerts"
              secondary="Get notified about security-related activities"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={profileData.security_alerts}
                onChange={(e) => handleInputChange('security_alerts', e.target.checked)}
                disabled={!editMode.notifications}
              />
            </ListItemSecondaryAction>
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Marketing Emails"
              secondary="Receive promotional and marketing emails"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={profileData.marketing_emails}
                onChange={(e) => handleInputChange('marketing_emails', e.target.checked)}
                disabled={!editMode.notifications}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>

        {editMode.notifications && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => handleSaveSection('notifications')}
              disabled={loading}
            >
              Save Changes
            </Button>
            <Button
              variant="outlined"
              onClick={() => toggleEditMode('notifications')}
            >
              Cancel
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderProfileSettings = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Profile & Privacy Settings</Typography>
          <IconButton onClick={() => toggleEditMode('privacy')}>
            {editMode.privacy ? <CancelIcon /> : <EditIcon />}
          </IconButton>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={!editMode.privacy}>
              <InputLabel>Profile Visibility</InputLabel>
              <Select
                value={profileData.profile_visibility}
                label="Profile Visibility"
                onChange={(e) => handleInputChange('profile_visibility', e.target.value)}
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="private">Private</MenuItem>
                <MenuItem value="hostel_only">Hostel Members Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={!editMode.privacy}>
              <InputLabel>Language</InputLabel>
              <Select
                value={profileData.language}
                label="Language"
                onChange={(e) => handleInputChange('language', e.target.value)}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="hi">Hindi</MenuItem>
                <MenuItem value="te">Telugu</MenuItem>
                <MenuItem value="ta">Tamil</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={!editMode.privacy}>
              <InputLabel>Theme</InputLabel>
              <Select
                value={profileData.theme}
                label="Theme"
                onChange={(e) => handleInputChange('theme', e.target.value)}
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="auto">Auto</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={!editMode.privacy}>
              <InputLabel>Timezone</InputLabel>
              <Select
                value={profileData.timezone}
                label="Timezone"
                onChange={(e) => handleInputChange('timezone', e.target.value)}
              >
                <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST)</MenuItem>
                <MenuItem value="UTC">UTC</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Contact Information Visibility
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={profileData.show_email}
                onChange={(e) => handleInputChange('show_email', e.target.checked)}
                disabled={!editMode.privacy}
              />
            }
            label="Show email to other users"
          />
          <FormControlLabel
            control={
              <Switch
                checked={profileData.show_phone}
                onChange={(e) => handleInputChange('show_phone', e.target.checked)}
                disabled={!editMode.privacy}
              />
            }
            label="Show phone number to other users"
          />
        </Box>

        {editMode.privacy && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => handleSaveSection('privacy')}
              disabled={loading}
            >
              Save Changes
            </Button>
            <Button
              variant="outlined"
              onClick={() => toggleEditMode('privacy')}
            >
              Cancel
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderPersonalInfo();
      case 1:
        return renderAccountSecurity();
      case 2:
        return renderNotifications();
      case 3:
        return renderProfileSettings();
      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        User Profile
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto' }}>
            {tabs.map((tab, index) => (
              <Button
                key={index}
                onClick={() => setActiveTab(index)}
                variant={activeTab === index ? 'contained' : 'text'}
                startIcon={tab.icon}
                sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
              >
                {tab.label}
              </Button>
            ))}
          </Box>
        </Box>

        {renderTabContent()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default UserProfileForm;
