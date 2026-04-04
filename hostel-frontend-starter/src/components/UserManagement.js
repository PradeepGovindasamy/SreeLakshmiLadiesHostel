import React, { useState, useEffect } from 'react';
import { userAPI, enhancedAPI } from '../api';
import { useUser } from '../contexts/UserContext';
import {
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Avatar,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Business as OwnerIcon,
  Security as WardenIcon,
  Home as TenantIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const roleIcons = {
  admin: <AdminIcon />,
  owner: <OwnerIcon />,
  warden: <WardenIcon />,
  tenant: <TenantIcon />
};

const roleColors = {
  admin: 'error',
  owner: 'primary', 
  warden: 'warning',
  tenant: 'success'
};

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // User creation dialog state
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // User data
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    is_active: true,
    // Profile data
    role: '',
    phone: '',
    address: '',
    // Role-specific data
    assigned_branches: [],
    department: '',
    hire_date: '',
    notes: ''
  });
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailsDialog, setUserDetailsDialog] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  const { getUserRole, hasAnyRole } = useUser();
  const userRole = getUserRole();

  const steps = isEditMode 
    ? ['User Information', 'Profile Details', 'Role Assignment', 'Review & Update']
    : ['User Information', 'Profile Details', 'Role Assignment', 'Review & Create'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [selectedRole, searchTerm]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Current user role:', userRole);
      console.log('User has admin/owner role?:', hasAnyRole(['admin', 'owner']));
      
      // Fetch branches for owner/warden assignment
      const branchResponse = await enhancedAPI.branches.list();
      console.log('Branches API response:', branchResponse);
      
      // Handle different response formats for branches
      let branchData;
      if (Array.isArray(branchResponse.data)) {
        branchData = branchResponse.data;
      } else if (branchResponse.data.results) {
        branchData = branchResponse.data.results;
      } else if (branchResponse.data.data) {
        branchData = branchResponse.data.data;
      } else {
        branchData = [];
      }
      
      setBranches(branchData);
      console.log('Fetched branches:', branchData);
      
    } catch (error) {
      console.error('Error fetching initial data:', error);
      console.error('Branches error details:', error.response?.data);
      setError(`Failed to load data: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setError(null);
      
      // Build query parameters
      const params = {};
      if (selectedRole !== 'all') {
        params.role = selectedRole;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      // Add timestamp to prevent caching
      params._t = Date.now();
      
      const response = await userAPI.listUsers(params);
      
      // Handle different response formats
      let userData;
      if (Array.isArray(response.data)) {
        userData = response.data;
      } else if (response.data.results) {
        userData = response.data.results;
      } else if (response.data.data) {
        userData = response.data.data;
      } else {
        userData = [];
      }
      
      setUsers(userData);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(`Failed to load users: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleCreateUser = async () => {
    try {
      // Validate form
      if (!formData.username || !formData.email || !formData.password || !formData.role) {
        setAlert({ open: true, message: 'Please fill in all required fields.', severity: 'error' });
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setAlert({ open: true, message: 'Passwords do not match.', severity: 'error' });
        return;
      }

      // Create user with profile
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        is_active: formData.is_active,
        profile: {
          role: formData.role,
          phone: formData.phone,
          address: formData.address,
          assigned_branches: formData.assigned_branches,
          department: formData.department,
          hire_date: formData.hire_date || null,
          notes: formData.notes
        }
      };

      await userAPI.createUserWithProfile(userData);
      setAlert({ open: true, message: 'User created successfully!', severity: 'success' });
      setCreateDialog(false);
      resetForm();
      await fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      setAlert({ 
        open: true, 
        message: error.response?.data?.message || 'Failed to create user.', 
        severity: 'error' 
      });
    }
  };

  const handleEditUser = async () => {
    try {
      // Validate form
      if (!formData.username || !formData.email || !formData.role) {
        setAlert({ open: true, message: 'Please fill in all required fields.', severity: 'error' });
        return;
      }

      // Prepare update data (exclude password if not provided)
      const updateData = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        is_active: formData.is_active,
        role: formData.role,
        phone_number: formData.phone,
        business_name: formData.business_name || '',
        business_license: formData.business_license || '',
      };

      // Only include password if provided
      if (formData.password && formData.password.trim()) {
        if (formData.password !== formData.confirmPassword) {
          setAlert({ open: true, message: 'Passwords do not match.', severity: 'error' });
          return;
        }
        updateData.password = formData.password;
      }

      await userAPI.update(editingUser.id, updateData);
      setAlert({ open: true, message: 'User updated successfully!', severity: 'success' });
      setEditDialog(false);
      resetForm();
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setAlert({ 
        open: true, 
        message: error.response?.data?.message || 'Failed to update user.', 
        severity: 'error' 
      });
    }
  };

  const handleViewDetails = async (user) => {
    try {
      setSelectedUser(user);
      const response = await userAPI.get(user.id);
      setSelectedUser(response.data);
      setUserDetailsDialog(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError('Failed to load user details.');
    }
  };

  const handleEdit = (user) => {
    setIsEditMode(true);
    setEditingUser(user);
    
    // Populate form with user data
    setFormData({
      username: user.username || '',
      email: user.email || '',
      password: '', // Don't pre-fill password for security
      confirmPassword: '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      is_active: user.is_active !== undefined ? user.is_active : true,
      role: user.role || user.profile?.role || '',
      phone: user.phone_number || user.profile?.phone_number || '',
      address: user.address || '',
      assigned_branches: user.assigned_branches || [],
      department: user.department || '',
      hire_date: user.hire_date || '',
      notes: user.notes || ''
    });
    
    setActiveStep(0);
    setEditDialog(true);
  };

  const handleDelete = async (user) => {
    if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      try {
        await userAPI.delete(user.id);
        setAlert({ open: true, message: 'User deleted successfully.', severity: 'success' });
        await fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        setAlert({ open: true, message: 'Failed to delete user.', severity: 'error' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      first_name: '',
      last_name: '',
      is_active: true,
      role: '',
      phone: '',
      address: '',
      assigned_branches: [],
      department: '',
      hire_date: '',
      notes: ''
    });
    setActiveStep(0);
    setIsEditMode(false);
    setEditingUser(null);
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const canManageUsers = hasAnyRole(['admin', 'owner']);
  const canCreateUsers = hasAnyRole(['admin', 'owner']);
  const canDeleteUsers = hasAnyRole(['admin']);

  // Apply client-side filters
  const filteredUsers = users.filter(user => {
    const matchesRole = selectedRole === 'all' || user.profile?.role === selectedRole;
    const matchesSearch = !searchTerm || 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // Calculate summary statistics
  const totalUsers = filteredUsers.length;
  const adminUsers = filteredUsers.filter(user => user.profile?.role === 'admin').length;
  const ownerUsers = filteredUsers.filter(user => user.profile?.role === 'owner').length;
  const wardenUsers = filteredUsers.filter(user => user.profile?.role === 'warden').length;
  const tenantUsers = filteredUsers.filter(user => user.profile?.role === 'tenant').length;

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username*"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                disabled={isEditMode}
                helperText={isEditMode ? "Username cannot be changed" : ""}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email*"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={isEditMode ? "New Password (leave blank to keep current)" : "Password*"}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!isEditMode}
                helperText={isEditMode ? "Only fill if you want to change the password" : ""}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={isEditMode ? "Confirm New Password" : "Confirm Password*"}
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required={!isEditMode && formData.password}
                helperText={isEditMode ? "Confirm new password if changing" : ""}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Active User"
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hire Date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Role*</InputLabel>
                <Select
                  value={formData.role}
                  label="Role*"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <MenuItem value="admin">Administrator</MenuItem>
                  <MenuItem value="owner">Property Owner</MenuItem>
                  <MenuItem value="warden">Warden</MenuItem>
                  <MenuItem value="tenant">Tenant</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {(formData.role === 'owner' || formData.role === 'warden') && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Assigned Properties</InputLabel>
                  <Select
                    multiple
                    value={formData.assigned_branches}
                    label="Assigned Properties"
                    onChange={(e) => setFormData({ ...formData, assigned_branches: e.target.value })}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const branch = branches.find(b => b.id === value);
                          return (
                            <Chip key={value} label={branch?.name || value} size="small" />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {branches.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        );
      case 3:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Review User Information</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Username:</strong> {formData.username}</Typography>
              <Typography><strong>Email:</strong> {formData.email}</Typography>
              <Typography><strong>Name:</strong> {formData.first_name} {formData.last_name}</Typography>
              <Typography><strong>Role:</strong> {formData.role}</Typography>
              <Typography><strong>Active:</strong> {formData.is_active ? 'Yes' : 'No'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Phone:</strong> {formData.phone || 'N/A'}</Typography>
              <Typography><strong>Department:</strong> {formData.department || 'N/A'}</Typography>
              <Typography><strong>Hire Date:</strong> {formData.hire_date || 'N/A'}</Typography>
              {formData.assigned_branches.length > 0 && (
                <Typography><strong>Assigned Properties:</strong> {
                  formData.assigned_branches.map(id => 
                    branches.find(b => b.id === id)?.name
                  ).join(', ')
                }</Typography>
              )}
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!canManageUsers) {
    return (
      <Box p={4}>
        <Alert severity="error">
          You don't have permission to manage users.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          User Management
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={fetchUsers}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          {canCreateUsers && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialog(true)}
              color="primary"
            >
              Create User
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PersonIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{totalUsers}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AdminIcon color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{adminUsers}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Administrators
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <OwnerIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{ownerUsers}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Owners
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <WardenIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{wardenUsers + tenantUsers}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Wardens & Tenants
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Search Users"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Username, email, or name..."
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Filter by Role</InputLabel>
              <Select
                value={selectedRole}
                label="Filter by Role"
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="admin">Administrator</MenuItem>
                <MenuItem value="owner">Property Owner</MenuItem>
                <MenuItem value="warden">Warden</MenuItem>
                <MenuItem value="tenant">Tenant</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Admins and Owners Table */}
      {(() => {
        const adminOwnerUsers = filteredUsers.filter(user => 
          ['admin', 'owner'].includes(user.profile?.role)
        );
        return adminOwnerUsers.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mb: 2, mt: 2, color: '#1976d2', fontWeight: 'bold' }}>
              Administrators & Owners ({adminOwnerUsers.length})
            </Typography>
            <Paper elevation={3} sx={{ mb: 3 }}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: '#e3f2fd' }}>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Contact Info</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {adminOwnerUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 2 }}>
                              {user.first_name?.charAt(0) || user.username?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">
                                {user.first_name && user.last_name 
                                  ? `${user.first_name} ${user.last_name}`
                                  : user.username
                                }
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                @{user.username}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{user.email}</Typography>
                            {user.profile?.phone && (
                              <Typography variant="caption" color="textSecondary">
                                {user.profile.phone}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={roleIcons[user.profile?.role] || <PersonIcon />}
                            label={user.profile?.role?.charAt(0).toUpperCase() + user.profile?.role?.slice(1) || 'No Role'}
                            color={roleColors[user.profile?.role] || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={user.is_active ? <CheckIcon /> : <CloseIcon />}
                            label={user.is_active ? 'Active' : 'Inactive'}
                            color={user.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(user.date_joined).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton 
                              color="info" 
                              size="small"
                              onClick={() => handleViewDetails(user)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton 
                              color="primary" 
                              size="small"
                              onClick={() => handleEdit(user)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {canDeleteUsers && (
                            <Tooltip title="Delete">
                              <IconButton 
                                color="error" 
                                size="small"
                                onClick={() => handleDelete(user)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        );
      })()}

      {/* Wardens Table */}
      {(() => {
        const wardenUsers = filteredUsers.filter(user => 
          user.profile?.role === 'warden'
        );
        return wardenUsers.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mb: 2, color: '#ed6c02', fontWeight: 'bold' }}>
              Wardens ({wardenUsers.length})
            </Typography>
            <Paper elevation={3} sx={{ mb: 3 }}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: '#fff3e0' }}>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Contact Info</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {wardenUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 2 }}>
                              {user.first_name?.charAt(0) || user.username?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">
                                {user.first_name && user.last_name 
                                  ? `${user.first_name} ${user.last_name}`
                                  : user.username
                                }
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                @{user.username}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{user.email}</Typography>
                            {user.profile?.phone && (
                              <Typography variant="caption" color="textSecondary">
                                {user.profile.phone}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={roleIcons[user.profile?.role] || <PersonIcon />}
                            label={user.profile?.role?.charAt(0).toUpperCase() + user.profile?.role?.slice(1) || 'No Role'}
                            color={roleColors[user.profile?.role] || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={user.is_active ? <CheckIcon /> : <CloseIcon />}
                            label={user.is_active ? 'Active' : 'Inactive'}
                            color={user.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(user.date_joined).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton 
                              color="info" 
                              size="small"
                              onClick={() => handleViewDetails(user)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton 
                              color="primary" 
                              size="small"
                              onClick={() => handleEdit(user)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {canDeleteUsers && (
                            <Tooltip title="Delete">
                              <IconButton 
                                color="error" 
                                size="small"
                                onClick={() => handleDelete(user)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        );
      })()}

      {/* Tenants Table */}
      {(() => {
        const tenantUsers = filteredUsers.filter(user => 
          user.profile?.role === 'tenant'
        );
        return tenantUsers.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mb: 2, color: '#2e7d32', fontWeight: 'bold' }}>
              Tenants ({tenantUsers.length})
            </Typography>
            <Paper elevation={3} sx={{ mb: 3 }}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: '#e8f5e8' }}>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Contact Info</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tenantUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 2 }}>
                              {user.first_name?.charAt(0) || user.username?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">
                                {user.first_name && user.last_name 
                                  ? `${user.first_name} ${user.last_name}`
                                  : user.username
                                }
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                @{user.username}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{user.email}</Typography>
                            {user.profile?.phone && (
                              <Typography variant="caption" color="textSecondary">
                                {user.profile.phone}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={roleIcons[user.profile?.role] || <PersonIcon />}
                            label={user.profile?.role?.charAt(0).toUpperCase() + user.profile?.role?.slice(1) || 'No Role'}
                            color={roleColors[user.profile?.role] || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={user.is_active ? <CheckIcon /> : <CloseIcon />}
                            label={user.is_active ? 'Active' : 'Inactive'}
                            color={user.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(user.date_joined).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton 
                              color="info" 
                              size="small"
                              onClick={() => handleViewDetails(user)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton 
                              color="primary" 
                              size="small"
                              onClick={() => handleEdit(user)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {canDeleteUsers && (
                            <Tooltip title="Delete">
                              <IconButton 
                                color="error" 
                                size="small"
                                onClick={() => handleDelete(user)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        );
      })()}

      {/* Show empty state if no users match filter */}
      {filteredUsers.length === 0 && (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No users found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {selectedRole !== 'all' 
              ? `No users with role "${selectedRole}" found.`
              : 'Try adjusting your search or role filter.'
            }
          </Typography>
        </Paper>
      )}

      {/* Create User Dialog */}
      <Dialog 
        open={createDialog} 
        onClose={() => setCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {renderStepContent(activeStep)}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleBack} disabled={activeStep === 0}>
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button onClick={handleCreateUser} variant="contained">
              Create User
            </Button>
          ) : (
            <Button onClick={handleNext} variant="contained">
              Next
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog 
        open={userDetailsDialog} 
        onClose={() => setUserDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          User Details - {selectedUser?.username}
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>User Information</Typography>
                <Typography><strong>Username:</strong> {selectedUser.username}</Typography>
                <Typography><strong>Email:</strong> {selectedUser.email}</Typography>
                <Typography><strong>Name:</strong> {selectedUser.first_name} {selectedUser.last_name}</Typography>
                <Typography><strong>Status:</strong> 
                  <Chip
                    label={selectedUser.is_active ? 'Active' : 'Inactive'}
                    color={selectedUser.is_active ? 'success' : 'default'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography><strong>Joined:</strong> 
                  {new Date(selectedUser.date_joined).toLocaleDateString()}
                </Typography>
                <Typography><strong>Last Login:</strong> 
                  {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleDateString() : 'Never'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Profile Information</Typography>
                {selectedUser.profile ? (
                  <>
                    <Typography><strong>Role:</strong> 
                      <Chip
                        label={selectedUser.profile.role}
                        color={roleColors[selectedUser.profile.role]}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    <Typography><strong>Phone:</strong> {selectedUser.profile.phone || 'N/A'}</Typography>
                    <Typography><strong>Address:</strong> {selectedUser.profile.address || 'N/A'}</Typography>
                    <Typography><strong>Department:</strong> {selectedUser.profile.department || 'N/A'}</Typography>
                    {selectedUser.profile.hire_date && (
                      <Typography><strong>Hire Date:</strong> 
                        {new Date(selectedUser.profile.hire_date).toLocaleDateString()}
                      </Typography>
                    )}
                    {selectedUser.profile.notes && (
                      <Typography><strong>Notes:</strong> {selectedUser.profile.notes}</Typography>
                    )}
                  </>
                ) : (
                  <Typography color="textSecondary">No profile information available</Typography>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog 
        open={editDialog} 
        onClose={() => {
          setEditDialog(false);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit User - {editingUser?.username}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {renderStepContent(activeStep)}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEditDialog(false);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button 
              onClick={handleEditUser}
              variant="contained"
              color="primary"
            >
              Update User
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              variant="contained"
              color="primary"
            >
              Next
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
      {alert.open && (
        <Alert 
          severity={alert.severity} 
          onClose={() => setAlert({ ...alert, open: false })}
          sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}
        >
          {alert.message}
        </Alert>
      )}
    </Box>
  );
}

export default UserManagement;
