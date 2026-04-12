import React, { useState, useEffect } from 'react';
import { enhancedAPI } from '../api';
import { useUser } from '../contexts/UserContext';
import TenantForm from './TenantForm';
import {
  Typography,
  Button,
  Box,
  CircularProgress,
  Snackbar,
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
  Badge
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  ExitToApp as ExitToAppIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';

function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantDetailsDialog, setTenantDetailsDialog] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [tenantFormOpen, setTenantFormOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [checkoutTenant, setCheckoutTenant] = useState(null);
  const [vacatingDate, setVacatingDate] = useState('');

  const { getUserRole, hasAnyRole } = useUser();
  const userRole = getUserRole();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (branches.length > 0) {
      fetchTenants();
    }
  }, [selectedBranch, searchTerm, branches]);

  // Separate useEffect for status filtering (frontend only)
  useEffect(() => {
    // Status filtering is handled in the filteredTenants computation
    // This useEffect ensures the component re-renders when selectedStatus changes
  }, [selectedStatus]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch branches and rooms for filter dropdowns
      const [branchResponse, roomResponse] = await Promise.all([
        enhancedAPI.branches.list(),
        enhancedAPI.rooms.list()
      ]);
      
      setBranches(branchResponse.data);
      setRooms(roomResponse.data);
      
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      setError(null);
      
      // Build query parameters (excluding status since we compute it on frontend)
      const params = {};
      if (selectedBranch !== 'all') {
        params.branch = selectedBranch;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      const response = await enhancedAPI.tenants.list(params);
      
      // Compute status for each tenant based on joining_date and vacating_date
      const tenantsWithStatus = response.data.map(tenant => ({
        ...tenant,
        status: computeTenantStatus(tenant)
      }));
      
      setTenants(tenantsWithStatus);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      setError('Failed to load tenants. Please try again.');
    }
  };

  // Helper function to compute tenant status
  const computeTenantStatus = (tenant) => {
    // If tenant has vacated (vacating_date is set)
    if (tenant.vacating_date) {
      return 'inactive';
    }
    
    // If tenant has joined (joining_date is set)
    if (tenant.joining_date) {
      return 'active';
    }
    
    // If tenant record exists but hasn't joined yet
    return 'pending';
  };

  const handleViewDetails = async (tenant) => {
    try {
      setSelectedTenant(tenant);
      const response = await enhancedAPI.tenants.get(tenant.id);
      
      // Compute status for the detailed tenant data
      const tenantWithStatus = {
        ...response.data,
        status: computeTenantStatus(response.data)
      };
      
      setSelectedTenant(tenantWithStatus);
      setTenantDetailsDialog(true);
    } catch (error) {
      console.error('Error fetching tenant details:', error);
      setError('Failed to load tenant details.');
    }
  };

  const handleEdit = async (tenant) => {
    try {
      // Fetch full tenant details to ensure we have all fields including vacating_date
      const response = await enhancedAPI.tenants.get(tenant.id);
      console.log('Full tenant data for editing:', response.data);
      
      // Compute status for the tenant
      const fullTenant = {
        ...response.data,
        status: computeTenantStatus(response.data)
      };
      
      setEditingTenant(fullTenant);
      setTenantFormOpen(true);
    } catch (error) {
      console.error('Error fetching tenant details for edit:', error);
      setAlert({ open: true, message: 'Failed to load tenant details for editing.', severity: 'error' });
    }
  };

  const handleDelete = async (tenant) => {
    if (window.confirm(`Are you sure you want to permanently delete tenant "${tenant.name}"? This action cannot be undone. Consider using "Checkout" instead to preserve the tenant's history.`)) {
      try {
        await enhancedAPI.tenants.delete(tenant.id);
        setAlert({ open: true, message: 'Tenant deleted successfully.', severity: 'success' });
        await fetchTenants(); // Refresh list
      } catch (error) {
        console.error('Error deleting tenant:', error);
        const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Failed to delete tenant.';
        setAlert({ open: true, message: errorMsg, severity: 'error' });
      }
    }
  };

  const handleCheckout = (tenant) => {
    setCheckoutTenant(tenant);
    // Set default vacating date to today
    const today = new Date().toISOString().split('T')[0];
    setVacatingDate(today);
    setCheckoutDialog(true);
  };

  const handleCheckoutConfirm = async () => {
    if (!checkoutTenant || !vacatingDate) {
      setAlert({ open: true, message: 'Please select a vacating date.', severity: 'error' });
      return;
    }

    try {
      await enhancedAPI.tenants.checkout(checkoutTenant.id, { vacating_date: vacatingDate });
      setAlert({ open: true, message: 'Tenant checked out successfully!', severity: 'success' });
      setCheckoutDialog(false);
      setCheckoutTenant(null);
      setVacatingDate('');
      await fetchTenants(); // Refresh list
    } catch (error) {
      console.error('Error checking out tenant:', error);
      setAlert({ open: true, message: 'Failed to checkout tenant.', severity: 'error' });
    }
  };

  const handleReactivate = async (tenant) => {
    if (window.confirm(`Are you sure you want to reactivate tenant "${tenant.name}"? This will clear their vacating date and mark them as active again.`)) {
      try {
        await enhancedAPI.tenants.reactivate(tenant.id);
        setAlert({ open: true, message: 'Tenant reactivated successfully!', severity: 'success' });
        await fetchTenants(); // Refresh list
      } catch (error) {
        console.error('Error reactivating tenant:', error);
        const errorMsg = error.response?.data?.error || 'Failed to reactivate tenant.';
        setAlert({ open: true, message: errorMsg, severity: 'error' });
      }
    }
  };

  const handleAdd = () => {
    setEditingTenant(null);
    setTenantFormOpen(true);
  };

  const handleTenantFormClose = () => {
    setTenantFormOpen(false);
    setEditingTenant(null);
  };

  const handleTenantFormSave = () => {
    fetchTenants(); // Refresh the list
    setTenantFormOpen(false);
    setEditingTenant(null);
    setAlert({ 
      open: true, 
      message: editingTenant ? 'Tenant updated successfully!' : 'Tenant onboarded successfully!', 
      severity: 'success' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'pending': return 'warning';
      case 'terminated': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircleIcon />;
      case 'pending': return <WarningIcon />;
      case 'terminated': return <DeleteIcon />;
      default: return <PersonIcon />;
    }
  };

  const canEdit = hasAnyRole(['owner', 'admin', 'warden']);
  const canDelete = hasAnyRole(['owner', 'admin']);
  const canAdd = hasAnyRole(['owner', 'admin', 'warden']);

  // Apply client-side filters
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = !searchTerm || 
      tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.phone_number?.includes(searchTerm);
    
    const matchesStatus = selectedStatus === 'all' || tenant.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate summary statistics
  const totalTenants = filteredTenants.length;
  const activeTenants = filteredTenants.filter(tenant => tenant.status === 'active').length;
  const pendingTenants = filteredTenants.filter(tenant => tenant.status === 'pending').length;
  const inactiveTenants = filteredTenants.filter(tenant => tenant.status !== 'active').length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          {userRole === 'owner' ? 'My Tenants' : 
           userRole === 'warden' ? 'Managed Tenants' : 
           'All Tenants'}
        </Typography>
        {canAdd && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            color="primary"
          >
            Add Tenant
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {(() => {
        const T_STATS = [
          { label: 'Total Tenants', val: totalTenants, icon: <PersonIcon />, grad: 'linear-gradient(135deg,#1e40af,#3b82f6)' },
          { label: 'Active', val: activeTenants, icon: <CheckCircleIcon />, grad: 'linear-gradient(135deg,#10b981,#059669)' },
          { label: 'Pending', val: pendingTenants, icon: <WarningIcon />, grad: 'linear-gradient(135deg,#f59e0b,#d97706)' },
          { label: 'Inactive', val: inactiveTenants, icon: <HomeIcon />, grad: 'linear-gradient(135deg,#6b7280,#4b5563)' },
        ];
        return (
          <Grid container spacing={3} mb={4}>
            {T_STATS.map(({ label, val, icon, grad }) => (
              <Grid item xs={12} sm={6} md={3} key={label}>
                <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden', position: 'relative', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 4 } }}>
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: grad }} />
                  <CardContent sx={{ pt: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Typography>
                        <Typography variant="h3" fontWeight={800} color="grey.900" sx={{ mt: 0.5, lineHeight: 1 }}>{val}</Typography>
                      </Box>
                      <Avatar sx={{ borderRadius: 2, background: grad, width: 44, height: 44 }}>{icon}</Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        );
      })()}

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid #e2e8f0', borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Search Tenants"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name, email, or phone..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Property</InputLabel>
              <Select
                value={selectedBranch}
                label="Property"
                onChange={(e) => setSelectedBranch(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Properties</MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
              {[
                { label: 'All', value: 'all' },
                { label: 'Active', value: 'active', bg: '#059669' },
                { label: 'Pending', value: 'pending', bg: '#f59e0b' },
                { label: 'Inactive', value: 'inactive', bg: '#6b7280' },
              ].map(({ label, value, bg }) => (
                <Chip
                  key={value}
                  label={label}
                  size="small"
                  onClick={() => setSelectedStatus(value)}
                  sx={{
                    cursor: 'pointer',
                    fontWeight: 600,
                    borderColor: selectedStatus === value ? (bg || '#1d4ed8') : '#e2e8f0',
                    backgroundColor: selectedStatus === value ? (bg || '#1d4ed8') : 'transparent',
                    color: selectedStatus === value ? '#fff' : 'text.secondary',
                    '&:hover': { opacity: 0.85 },
                  }}
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tenants Table */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, color: 'text.secondary', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc' } }}>
                <TableCell>Tenant</TableCell>
                <TableCell>Contact Info</TableCell>
                <TableCell>Property & Room</TableCell>
                <TableCell>Occupancy Period</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Rent Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTenants
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((tenant) => (
                  <TableRow key={tenant.id} sx={{ borderLeft: tenant.status === 'active' ? '3px solid #22c55e' : tenant.status === 'pending' ? '3px solid #f59e0b' : '3px solid #d1d5db', '&:hover': { backgroundColor: '#f8fafc' } }}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2 }}>
                          {tenant.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {tenant.name}
                          </Typography>
                          {tenant.guardian_name && (
                            <Typography variant="caption" color="textSecondary">
                              Guardian: {tenant.guardian_name}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {tenant.email && (
                          <Box display="flex" alignItems="center" mb={0.5}>
                            <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">{tenant.email}</Typography>
                          </Box>
                        )}
                        {tenant.phone_number && (
                          <Box display="flex" alignItems="center">
                            <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">{tenant.phone_number}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {tenant.branch_name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {tenant.room_display || 'Room: Not Assigned'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {tenant.joining_date && (
                          <Box display="flex" alignItems="center" mb={0.5}>
                            <CalendarIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              From: {new Date(tenant.joining_date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}
                        {tenant.vacating_date && (
                          <Typography variant="caption" color="textSecondary">
                            To: {new Date(tenant.vacating_date).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(tenant.status)}
                        label={tenant.status?.charAt(0).toUpperCase() + tenant.status?.slice(1) || 'Unknown'}
                        color={getStatusColor(tenant.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {tenant.rent_status && (
                        <Chip
                          label={tenant.rent_status}
                          color={tenant.rent_status === 'paid' ? 'success' : 
                                 tenant.rent_status === 'pending' ? 'warning' : 'error'}
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton 
                          color="info" 
                          size="small"
                          onClick={() => handleViewDetails(tenant)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {canEdit && (
                        <Tooltip title="Edit">
                          <IconButton 
                            color="primary" 
                            size="small"
                            onClick={() => handleEdit(tenant)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canEdit && tenant.status === 'active' && (
                        <Tooltip title="Checkout/Vacate">
                          <IconButton 
                            color="warning" 
                            size="small"
                            onClick={() => handleCheckout(tenant)}
                          >
                            <ExitToAppIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canEdit && tenant.status === 'inactive' && (
                        <Tooltip title="Reactivate">
                          <IconButton 
                            color="success" 
                            size="small"
                            onClick={() => handleReactivate(tenant)}
                          >
                            <RestoreIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Permanent Delete (Not Recommended)">
                          <IconButton 
                            color="error" 
                            size="small"
                            onClick={() => handleDelete(tenant)}
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

        <TablePagination
          component="div"
          count={filteredTenants.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Tenant Details Dialog */}
      <Dialog 
        open={tenantDetailsDialog} 
        onClose={() => setTenantDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Tenant Details - {selectedTenant?.name}
        </DialogTitle>
        <DialogContent>
          {selectedTenant && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Personal Information</Typography>
                <Typography><strong>Name:</strong> {selectedTenant.name}</Typography>
                <Typography><strong>Email:</strong> {selectedTenant.email || 'N/A'}</Typography>
                <Typography><strong>Phone:</strong> {selectedTenant.phone_number || 'N/A'}</Typography>
                <Typography><strong>Address:</strong> {selectedTenant.address || 'N/A'}</Typography>
                {selectedTenant.guardian_name && (
                  <Typography><strong>Guardian:</strong> {selectedTenant.guardian_name}</Typography>
                )}
                {selectedTenant.guardian_contact && (
                  <Typography><strong>Guardian Contact:</strong> {selectedTenant.guardian_contact}</Typography>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Accommodation Details</Typography>
                <Typography><strong>Property:</strong> {selectedTenant.branch_name || 'N/A'}</Typography>
                <Typography><strong>Room:</strong> {selectedTenant.room_display || 'Not Assigned'}</Typography>
                <Typography><strong>Join Date:</strong> 
                  {selectedTenant.joining_date ? new Date(selectedTenant.joining_date).toLocaleDateString() : 'N/A'}
                </Typography>
                {selectedTenant.vacating_date && (
                  <Typography><strong>Vacating Date:</strong> 
                    {new Date(selectedTenant.vacating_date).toLocaleDateString()}
                  </Typography>
                )}
                <Typography><strong>Status:</strong> 
                  <Chip
                    label={selectedTenant.status}
                    color={getStatusColor(selectedTenant.status)}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Additional Information</Typography>
                {selectedTenant.emergency_contact && (
                  <Typography><strong>Emergency Contact:</strong> {selectedTenant.emergency_contact}</Typography>
                )}
                {selectedTenant.id_proof && (
                  <Typography><strong>ID Proof:</strong> {selectedTenant.id_proof}</Typography>
                )}
                {selectedTenant.notes && (
                  <Typography><strong>Notes:</strong> {selectedTenant.notes}</Typography>
                )}
                <Typography><strong>Created:</strong> 
                  {new Date(selectedTenant.created_at).toLocaleDateString()}
                </Typography>
                <Typography><strong>Last Updated:</strong> 
                  {new Date(selectedTenant.updated_at).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTenantDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Checkout/Vacate Tenant Dialog */}
      <Dialog 
        open={checkoutDialog} 
        onClose={() => setCheckoutDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Checkout Tenant - {checkoutTenant?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Please select the vacating date for this tenant. This will mark them as inactive but preserve their history.
            </Typography>
            <TextField
              label="Vacating Date"
              type="date"
              fullWidth
              value={vacatingDate}
              onChange={(e) => setVacatingDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ mt: 2 }}
              helperText="The date when the tenant will vacate the room"
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              Note: The tenant's record will be preserved for history. You can reactivate them later if needed.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCheckoutConfirm} 
            variant="contained" 
            color="warning"
            startIcon={<ExitToAppIcon />}
          >
            Checkout Tenant
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={alert.open}
        autoHideDuration={3000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>

      {/* Tenant Form Dialog */}
      <TenantForm
        open={tenantFormOpen}
        onClose={handleTenantFormClose}
        onSave={handleTenantFormSave}
        tenant={editingTenant}
        isEdit={Boolean(editingTenant)}
      />
    </Box>
  );
}

export default Tenants;
