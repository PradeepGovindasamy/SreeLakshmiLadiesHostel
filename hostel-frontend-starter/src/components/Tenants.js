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
  Warning as WarningIcon
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

  const handleEdit = (tenant) => {
    setEditingTenant(tenant);
    setTenantFormOpen(true);
  };

  const handleDelete = async (tenant) => {
    if (window.confirm(`Are you sure you want to delete tenant "${tenant.name}"?`)) {
      try {
        await enhancedAPI.tenants.delete(tenant.id);
        setAlert({ open: true, message: 'Tenant deleted successfully.', severity: 'success' });
        await fetchTenants(); // Refresh list
      } catch (error) {
        console.error('Error deleting tenant:', error);
        setAlert({ open: true, message: 'Failed to delete tenant.', severity: 'error' });
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
      tenant.phone?.includes(searchTerm);
    
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
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PersonIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{totalTenants}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Tenants
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
                <CheckCircleIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{activeTenants}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active
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
                <WarningIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{pendingTenants}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending
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
                <HomeIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{inactiveTenants}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Inactive
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
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Search Tenants"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name, email, or phone..."
            />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Filter by Property</InputLabel>
              <Select
                value={selectedBranch}
                label="Filter by Property"
                onChange={(e) => setSelectedBranch(e.target.value)}
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
          
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Filter by Status"
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="terminated">Terminated</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tenants Table */}
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#e3f2fd' }}>
              <TableRow>
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
                  <TableRow key={tenant.id}>
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
                        {tenant.phone && (
                          <Box display="flex" alignItems="center">
                            <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">{tenant.phone}</Typography>
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
                          Room: {tenant.room_number || 'Not Assigned'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {tenant.join_date && (
                          <Box display="flex" alignItems="center" mb={0.5}>
                            <CalendarIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              From: {new Date(tenant.join_date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}
                        {tenant.leave_date && (
                          <Typography variant="caption" color="textSecondary">
                            To: {new Date(tenant.leave_date).toLocaleDateString()}
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
                      {canDelete && (
                        <Tooltip title="Delete">
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
                <Typography><strong>Phone:</strong> {selectedTenant.phone || 'N/A'}</Typography>
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
                <Typography><strong>Room:</strong> {selectedTenant.room_number || 'Not Assigned'}</Typography>
                <Typography><strong>Join Date:</strong> 
                  {selectedTenant.join_date ? new Date(selectedTenant.join_date).toLocaleDateString() : 'N/A'}
                </Typography>
                {selectedTenant.leave_date && (
                  <Typography><strong>Leave Date:</strong> 
                    {new Date(selectedTenant.leave_date).toLocaleDateString()}
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
