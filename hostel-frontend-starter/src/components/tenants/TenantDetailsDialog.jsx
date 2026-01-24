import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Divider,
  Box,
  Chip,
  Paper
} from '@mui/material';
import {
  Person as PersonIcon,
  Home as HomeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  ContactEmergency as EmergencyIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';

/**
 * Tenant Details Dialog
 * Displays comprehensive tenant information
 */
function TenantDetailsDialog({ open, onClose, tenant, readOnly = false }) {
  if (!tenant) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const DetailRow = ({ icon, label, value }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Box sx={{ mr: 2, color: 'primary.main' }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body1">
          {value || 'Not provided'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon />
          <Typography variant="h6">Tenant Details</Typography>
          {tenant.vacating_date && (
            <Chip label="Vacated" color="default" size="small" />
          )}
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Personal Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              Personal Information
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <DetailRow 
                    icon={<PersonIcon />} 
                    label="Full Name" 
                    value={tenant.name} 
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DetailRow 
                    icon={<PhoneIcon />} 
                    label="Phone Number" 
                    value={tenant.phone_number} 
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DetailRow 
                    icon={<EmailIcon />} 
                    label="Email" 
                    value={tenant.email} 
                  />
                </Grid>
                <Grid item xs={12}>
                  <DetailRow 
                    icon={<HomeIcon />} 
                    label="Address" 
                    value={tenant.address} 
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Room Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              Room Information
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <DetailRow 
                    icon={<HomeIcon />} 
                    label="Room" 
                    value={tenant.room_name || tenant.room?.room_name} 
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Stay Type
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip 
                      label={tenant.stay_type || 'Not specified'} 
                      color={tenant.stay_type === 'monthly' ? 'primary' : 'secondary'}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DetailRow 
                    icon={<CalendarIcon />} 
                    label="Joining Date" 
                    value={formatDate(tenant.joining_date)} 
                  />
                </Grid>
                {tenant.vacating_date && (
                  <Grid item xs={12} sm={6}>
                    <DetailRow 
                      icon={<CalendarIcon />} 
                      label="Vacating Date" 
                      value={formatDate(tenant.vacating_date)} 
                    />
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>

          {/* Emergency Contact */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              Emergency Contact
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <DetailRow 
                    icon={<EmergencyIcon />} 
                    label="Emergency Contact Name" 
                    value={tenant.emergency_contact_name} 
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DetailRow 
                    icon={<PhoneIcon />} 
                    label="Emergency Contact Phone" 
                    value={tenant.emergency_contact_phone} 
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* ID Proof */}
          {tenant.id_proof_type && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                ID Proof
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <DetailRow 
                      icon={<BadgeIcon />} 
                      label="ID Type" 
                      value={tenant.id_proof_type} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DetailRow 
                      icon={<BadgeIcon />} 
                      label="ID Number" 
                      value={tenant.id_proof_number} 
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions>
        {readOnly && (
          <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto', ml: 2 }}>
            This is a read-only view
          </Typography>
        )}
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TenantDetailsDialog;
