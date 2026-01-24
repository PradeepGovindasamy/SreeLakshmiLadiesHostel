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
  Typography,
  Paper,
  Collapse,
  IconButton,
  Chip
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon, 
  ExitToApp as ExitIcon 
} from '@mui/icons-material';

/**
 * Vacated Tenants Section
 * Displays historical tenant data with pagination (read-only)
 * 
 * Key behaviors:
 * - NOT loaded on initial page mount (performance optimization)
 * - Loads ONLY when section is expanded
 * - Shows only INACTIVE status tenants (vacated)
 * - Read-only view (no edit, no payment actions)
 * - Paginated to handle large datasets
 * - Respects the SAME filters as active tenants: Branch, Room, Search
 * - Visually muted to indicate historical/inactive status
 */
function VacatedTenantsSection() {
  const [tenants, setTenants] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false); // Collapsed by default
  const [dataLoaded, setDataLoaded] = useState(false); // Track if data was ever loaded
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // Fetch branches on component mount (lightweight operation)
  useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch vacated tenants ONLY when expanded and filters change
  useEffect(() => {
    if (expanded && branches.length > 0) {
      fetchVacatedTenants();
    }
  }, [page, rowsPerPage, selectedBranch, searchTerm, expanded, branches]);

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
   * Fetch vacated tenants with backend-driven pagination and filtering
   * Only called when section is expanded
   * Uses status=vacated to filter INACTIVE tenants
   */
  const fetchVacatedTenants = async () => {
    try {
      setLoading(true);
      
      // Backend pagination for vacated tenants (can grow to thousands)
      const params = {
        status: 'vacated', // Filter for INACTIVE status tenants
        page: page + 1, // DRF uses 1-based indexing
        page_size: rowsPerPage,
      };
      
      // Respect existing filters
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
      
      setDataLoaded(true); // Mark that data has been loaded at least once
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

  const handleExpandToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 3, 
        backgroundColor: '#fafafa', // Slightly muted background for historical data
        opacity: expanded ? 1 : 0.85 // More muted when collapsed
      }}
    >
      {/* Section Header - Collapsible */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: 'pointer',
          mb: expanded ? 3 : 0
        }}
        onClick={handleExpandToggle}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ExitIcon color="action" fontSize="large" />
          <Typography variant="h5" component="h2" color="text.secondary">
            Vacated Tenants
          </Typography>
          <Chip 
            label="Historical Records" 
            size="small" 
            color="default" 
            sx={{ ml: 1 }} 
          />
        </Box>
        
        <IconButton
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s'
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>

      {/* Expandable Content - loads data only when expanded */}
      <Collapse in={expanded} timeout="auto" unmountOnExit={false}>
        {/* Info Banner */}
        <Alert severity="info" sx={{ mb: 3 }}>
          This is a read-only historical view of vacated tenants. Records are preserved for reference.
        </Alert>

        {/* Filters - SAME as active tenants section */}
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

        {/* Tenant Table - reusing existing component */}
        {loading && !dataLoaded ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TenantTable
              tenants={tenants}
              loading={loading}
              readOnly={true} // Read-only mode
              showVacatedDate={true} // Show vacating date column
              canEdit={false}
              canDelete={false}
              onView={handleView}
            />

            {/* Pagination - backend-driven for performance */}
            {totalCount > 0 && (
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
                sx={{ mt: 2 }}
              />
            )}
          </>
        )}
      </Collapse>

      {/* Tenant Details Dialog - EXISTING functionality preserved */}
      {detailsDialog && (
        <TenantDetailsDialog
          open={detailsDialog}
          onClose={() => setDetailsDialog(false)}
          tenant={selectedTenant}
          readOnly={true}
        />
      )}

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

export default VacatedTenantsSection;
