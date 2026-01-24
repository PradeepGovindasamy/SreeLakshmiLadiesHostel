import React, { useState, useEffect } from 'react';
import { enhancedAPI } from '../../api';
import TenantTable from './TenantTable';
import TenantDetailsDialog from './TenantDetailsDialog';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  Snackbar,
  Alert,
  CircularProgress,
  Typography
} from '@mui/material';

/**
 * Vacated Tenants Tab
 * Displays historical tenant data with pagination (read-only)
 */
function VacatedTenantsTab() {
  const [tenants, setTenants] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (branches.length > 0) {
      fetchVacatedTenants();
    }
  }, [page, rowsPerPage, selectedBranch, searchTerm, branches]);

  const fetchBranches = async () => {
    try {
      const response = await enhancedAPI.branches.list();
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
      showAlert('Failed to load branches', 'error');
    }
  };

  const fetchVacatedTenants = async () => {
    try {
      setLoading(true);
      
      // Backend pagination for vacated tenants (can grow to thousands)
      const params = {
        status: 'vacated',
        page: page + 1, // DRF uses 1-based indexing
        page_size: rowsPerPage,
      };
      
      if (selectedBranch !== 'all') {
        params.branch = selectedBranch;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      const response = await enhancedAPI.tenants.list(params);
      
      // Handle both paginated and non-paginated responses
      if (response.data.results) {
        setTenants(response.data.results);
        setTotalCount(response.data.count);
      } else {
        setTenants(response.data);
        setTotalCount(response.data.length);
      }
    } catch (error) {
      console.error('Error fetching vacated tenants:', error);
      showAlert('Failed to load vacated tenants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, severity = 'info') => {
    setAlert({ open: true, message, severity });
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

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page
  };

  if (loading && tenants.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Info Banner */}
      <Alert severity="info" sx={{ mb: 3 }}>
        This is a read-only historical view of vacated tenants. To reactivate a tenant, contact an administrator.
      </Alert>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Search vacated tenants..."
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
      </Box>

      {/* Tenant Table */}
      <TenantTable
        tenants={tenants}
        loading={loading}
        readOnly={true}
        showVacatedDate={true}
        canEdit={false}
        canDelete={false}
        onView={handleView}
      />

      {/* Pagination */}
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={[10, 25, 50, 100]}
        labelDisplayedRows={({ from, to, count }) => 
          `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`
        }
      />

      {/* Tenant Details Dialog */}
      {detailsDialog && (
        <TenantDetailsDialog
          open={detailsDialog}
          onClose={() => setDetailsDialog(false)}
          tenant={selectedTenant}
          readOnly={true}
        />
      )}

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert onClose={() => setAlert({ ...alert, open: false })} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default VacatedTenantsTab;
