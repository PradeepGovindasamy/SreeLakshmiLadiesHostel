import React, { useState, useEffect, useCallback } from 'react';
import { enhancedAPI } from '../../api';
import { useUser } from '../../contexts/UserContext';
import TenantTable from './TenantTable';
import TenantForm from '../TenantForm';
import TenantDetailsDialog from './TenantDetailsDialog';
import {
  Button,
  Box,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert,
  CircularProgress,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Add as AddIcon, People as PeopleIcon } from '@mui/icons-material';

/**
 * Active Tenants Section
 * Displays currently active tenants with full CRUD operations
 * 
 * Key behaviors:
 * - Loads immediately on page mount
 * - Shows only ACTIVE status tenants
 * - Respects existing filters: Branch, Room, Search
 * - Fully editable and actionable (edit, checkout, delete, payments)
 */
function ActiveTenantsSection() {
  const [tenants, setTenants] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [tenantFormOpen, setTenantFormOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [checkoutTenant, setCheckoutTenant] = useState(null);
  const [vacatingDate, setVacatingDate] = useState('');

  const { hasAnyRole } = useUser();

  // Fetch branches on component mount
  useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch active tenants when filters change
  useEffect(() => {
    if (branches.length > 0) {
      fetchActiveTenants();
    }
  }, [selectedBranch, searchTerm, branches]);

  const fetchBranches = async () => {
    try {
      const response = await enhancedAPI.branches.list();
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
      showAlert('Failed to load branches', 'error');
    }
  };

  /**
   * Fetch active tenants from backend
   * Respects existing filters: branch, search
   * Backend filters by status=active to exclude vacated tenants
   */
  const fetchActiveTenants = async () => {
    try {
      setLoading(true);
      
      // Backend filters active tenants (status=ACTIVE, vacating_date=null)
      const params = { status: 'active' };
      
      if (selectedBranch !== 'all') {
        params.branch = selectedBranch;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      const response = await enhancedAPI.tenants.list(params);
      setTenants(response.data);
    } catch (error) {
      console.error('Error fetching active tenants:', error);
      showAlert('Failed to load active tenants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, severity = 'success') => {
    setAlert({ open: true, message, severity });
  };

  const handleAdd = () => {
    setEditingTenant(null);
    setTenantFormOpen(true);
  };

  const handleEdit = async (tenant) => {
    try {
      const response = await enhancedAPI.tenants.get(tenant.id);
      setEditingTenant(response.data);
      setTenantFormOpen(true);
    } catch (error) {
      console.error('Error fetching tenant details:', error);
      showAlert('Failed to load tenant details', 'error');
    }
  };

  const handleView = async (tenant) => {
    try {
      const response = await enhancedAPI.tenants.get(tenant.id);
      setSelectedTenant(response.data);
      setDetailsDialog(true);
    } catch (error) {
      console.error('Error fetching tenant details:', error);
      showAlert('Failed to load tenant details', 'error');
    }
  };

  const handleDelete = async (tenant) => {
    if (window.confirm(`Are you sure you want to delete "${tenant.name}"? Consider using Checkout instead to preserve history.`)) {
      try {
        await enhancedAPI.tenants.delete(tenant.id);
        showAlert('Tenant deleted successfully');
        fetchActiveTenants();
      } catch (error) {
        console.error('Error deleting tenant:', error);
        showAlert('Failed to delete tenant', 'error');
      }
    }
  };

  const handleCheckout = (tenant) => {
    setCheckoutTenant(tenant);
    const today = new Date().toISOString().split('T')[0];
    setVacatingDate(today);
    setCheckoutDialog(true);
  };

  const handleCheckoutConfirm = async () => {
    if (!checkoutTenant || !vacatingDate) {
      showAlert('Please select a vacating date', 'error');
      return;
    }

    try {
      await enhancedAPI.tenants.checkout(checkoutTenant.id, { vacating_date: vacatingDate });
      showAlert('Tenant checked out successfully');
      setCheckoutDialog(false);
      setCheckoutTenant(null);
      setVacatingDate('');
      fetchActiveTenants(); // Refresh the list
    } catch (error) {
      console.error('Error checking out tenant:', error);
      showAlert('Failed to checkout tenant', 'error');
    }
  };

  const handleFormClose = () => {
    setTenantFormOpen(false);
    setEditingTenant(null);
  };

  const handleFormSave = () => {
    fetchActiveTenants();
    setTenantFormOpen(false);
    setEditingTenant(null);
    showAlert(editingTenant ? 'Tenant updated successfully' : 'Tenant added successfully');
  };

  const canEdit = hasAnyRole(['owner', 'admin', 'warden']);
  const canDelete = hasAnyRole(['owner', 'admin']);
  const canAdd = hasAnyRole(['owner', 'admin', 'warden']);

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      {/* Section Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <PeopleIcon color="primary" fontSize="large" />
        <Typography variant="h5" component="h2">
          Active Tenants
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
          ({loading ? '...' : tenants.length})
        </Typography>
      </Box>

      {/* Filters and Actions - EXISTING filters preserved exactly */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Search tenants..."
          placeholder="Name, phone, email, room..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, minWidth: '200px' }}
        />
        
        <FormControl size="small" sx={{ minWidth: '150px' }}>
          <InputLabel>Branch</InputLabel>
          <Select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            label="Branch"
          >
            <MenuItem value="all">All Branches</MenuItem>
            {branches.map((branch) => (
              <MenuItem key={branch.id} value={branch.id}>
                {branch.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {canAdd && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Add Tenant
          </Button>
        )}
      </Box>

      {/* Tenant Table - reusing existing component */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TenantTable
          tenants={tenants}
          loading={loading}
          readOnly={false}
          showVacatedDate={false}
          canEdit={canEdit}
          canDelete={canDelete}
          onView={handleView}
          onEdit={handleEdit}
          onCheckout={handleCheckout}
          onDelete={handleDelete}
        />
      )}

      {/* Tenant Form Dialog - EXISTING functionality preserved */}
      {tenantFormOpen && (
        <TenantForm
          open={tenantFormOpen}
          onClose={handleFormClose}
          onSave={handleFormSave}
          tenant={editingTenant}
        />
      )}

      {/* Tenant Details Dialog - EXISTING functionality preserved */}
      {detailsDialog && (
        <TenantDetailsDialog
          open={detailsDialog}
          onClose={() => setDetailsDialog(false)}
          tenant={selectedTenant}
        />
      )}

      {/* Checkout Confirmation Dialog */}
      <Dialog open={checkoutDialog} onClose={() => setCheckoutDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Checkout Tenant</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Checking out: <strong>{checkoutTenant?.name}</strong>
          </Typography>
          <TextField
            fullWidth
            label="Vacating Date"
            type="date"
            value={vacatingDate}
            onChange={(e) => setVacatingDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="Select the date when the tenant vacated"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutDialog(false)}>Cancel</Button>
          <Button onClick={handleCheckoutConfirm} variant="contained" color="warning">
            Confirm Checkout
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar - EXISTING notification system preserved */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert onClose={() => setAlert({ ...alert, open: false })} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

export default ActiveTenantsSection;
