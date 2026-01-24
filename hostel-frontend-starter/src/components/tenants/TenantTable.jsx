import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  CircularProgress,
  Box,
  Chip,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  ExitToApp as CheckoutIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

/**
 * Reusable Tenant Table Component
 * Used by both Active and Vacated tenant tabs
 */
function TenantTable({
  tenants,
  loading,
  readOnly = false,
  showVacatedDate = false,
  canEdit = true,
  canDelete = true,
  onView,
  onEdit,
  onCheckout,
  onDelete
}) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tenants || tenants.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 5 }}>
        <Typography variant="h6" color="text.secondary">
          No tenants found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {readOnly 
            ? 'No vacated tenants match your search criteria.'
            : 'Click "Add Tenant" to onboard a new tenant.'}
        </Typography>
      </Box>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStayTypeBadge = (stayType) => {
    const color = stayType === 'monthly' ? 'primary' : 'secondary';
    return (
      <Chip 
        label={stayType || 'N/A'} 
        color={color} 
        size="small"
        sx={{ textTransform: 'capitalize' }}
      />
    );
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Name</strong></TableCell>
            <TableCell><strong>Room</strong></TableCell>
            <TableCell><strong>Phone</strong></TableCell>
            <TableCell><strong>Stay Type</strong></TableCell>
            <TableCell><strong>Joined</strong></TableCell>
            {showVacatedDate && <TableCell><strong>Vacated</strong></TableCell>}
            <TableCell align="center"><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tenants.map((tenant) => (
            <TableRow key={tenant.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {tenant.name}
                </Typography>
                {tenant.email && (
                  <Typography variant="caption" color="text.secondary">
                    {tenant.email}
                  </Typography>
                )}
              </TableCell>
              
              <TableCell>
                {tenant.room_name || tenant.room?.room_name || (
                  <Typography variant="body2" color="text.secondary">
                    Not assigned
                  </Typography>
                )}
              </TableCell>
              
              <TableCell>{tenant.phone_number || '-'}</TableCell>
              
              <TableCell>{getStayTypeBadge(tenant.stay_type)}</TableCell>
              
              <TableCell>{formatDate(tenant.joining_date)}</TableCell>
              
              {showVacatedDate && (
                <TableCell>{formatDate(tenant.vacating_date)}</TableCell>
              )}
              
              <TableCell align="center">
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                  {/* View button - always available */}
                  <Tooltip title="View Details">
                    <IconButton 
                      size="small" 
                      onClick={() => onView?.(tenant)}
                      color="info"
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  {/* Edit button - only for non-read-only */}
                  {!readOnly && canEdit && onEdit && (
                    <Tooltip title="Edit Tenant">
                      <IconButton 
                        size="small" 
                        onClick={() => onEdit(tenant)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  {/* Checkout button - only for active tenants */}
                  {!readOnly && onCheckout && (
                    <Tooltip title="Checkout Tenant">
                      <IconButton 
                        size="small" 
                        onClick={() => onCheckout(tenant)}
                        color="warning"
                      >
                        <CheckoutIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  {/* Delete button - only for non-read-only */}
                  {!readOnly && canDelete && onDelete && (
                    <Tooltip title="Delete Tenant">
                      <IconButton 
                        size="small" 
                        onClick={() => onDelete(tenant)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default TenantTable;
