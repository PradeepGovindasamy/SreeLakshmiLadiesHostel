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
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Chip
} from '@mui/material';
import { enhancedAPI, userAPI } from '../api';
import { useUser } from '../contexts/UserContext';

const steps = ['Basic Information', 'Contact Details', 'Property Features', 'Review & Save'];

function PropertyForm({ open, onClose, onSave, property = null, isEdit = false }) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [owners, setOwners] = useState([]); // Initialize as empty array
  
  const { getUserRole } = useUser();
  const userRole = getUserRole();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contact_phone: '',
    contact_email: '',
    owner: '',
    is_active: true,
    property_type: 'ladies_hostel',
    total_floors: 1,
    num_rooms: '',
    num_bathrooms: '',
    has_parking: false,
    has_wifi: false,
    has_ac: false,
    has_laundry: false,
    has_security: false,
    has_mess: false,
    amenities: '',
    rules_and_regulations: '',
    nearby_facilities: '',
    emergency_contact: '',
    established_year: new Date().getFullYear(),
    established_date: '',
    license_number: '',
    notes: ''
  });

  useEffect(() => {
    if (open) {
      fetchOwners();
      if (isEdit && property) {
        // Debug logging to see property structure
        console.log('Editing property:', property);
        console.log('Property owner field:', property.owner);
        console.log('Property owner_id field:', property.owner_id);
        console.log('Property type:', property.property_type);
        
        setFormData({
          name: property.name || '',
          description: property.description || '',
          address: property.address || '',
          city: property.city || '',
          state: property.state || '',
          pincode: property.pincode || '',
          contact_phone: property.contact_phone || '',
          contact_email: property.contact_email || '',
          // Handle owner field - could be object or ID
          owner: property.owner?.id || property.owner_id || property.owner || '',
          is_active: property.is_active !== undefined ? property.is_active : true,
          property_type: property.property_type || 'ladies_hostel',
          total_floors: property.total_floors || 1,
          num_rooms: property.num_rooms || '',
          num_bathrooms: property.num_bathrooms || '',
          has_parking: property.has_parking || false,
          has_wifi: property.has_wifi || false,
          has_ac: property.has_ac || false,
          has_laundry: property.has_laundry || false,
          has_security: property.has_security || false,
          has_mess: property.has_mess || false,
          amenities: property.amenities || '',
          rules_and_regulations: property.rules_and_regulations || '',
          nearby_facilities: property.nearby_facilities || '',
          emergency_contact: property.emergency_contact || '',
          established_year: property.established_year || new Date().getFullYear(),
          established_date: property.established_date || '',
          license_number: property.license_number || '',
          notes: property.notes || ''
        });
        
        console.log('Form data after setting:', {
          owner: property.owner?.id || property.owner_id || property.owner || '',
          property_type: property.property_type || 'ladies_hostel',
          is_active: property.is_active !== undefined ? property.is_active : true,
          has_parking: property.has_parking || false,
          has_wifi: property.has_wifi || false
        });
      }
    }
  }, [open, isEdit, property]);

  // Debug effect to track formData changes
  useEffect(() => {
    console.log('FormData updated:', formData);
  }, [formData]);

  const fetchOwners = async () => {
    try {
      console.log('Fetching owners...');
      const response = await userAPI.list({ role: 'owner' });
      console.log('Owners API response:', response);
      
      // Handle different response formats
      let ownersData;
      if (Array.isArray(response.data)) {
        ownersData = response.data;
      } else if (response.data.results) {
        ownersData = response.data.results;
      } else if (response.data.data) {
        ownersData = response.data.data;
      } else {
        ownersData = [];
      }
      
      console.log('Processed owners data:', ownersData);
      setOwners(Array.isArray(ownersData) ? ownersData : []);
    } catch (error) {
      console.error('Error fetching owners:', error);
      setOwners([]); // Set empty array on error
    }
  };

  const handleInputChange = (field, value) => {
    console.log(`Field changed: ${field} = ${value}`);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const validateStep = (step) => {
    switch (step) {
      case 0: // Basic Information
        if (!formData.name.trim()) {
          setError('Property name is required');
          return false;
        }
        if (!formData.address.trim()) {
          setError('Address is required');
          return false;
        }
        break;
      case 1: // Contact Details
        if (!formData.contact_phone.trim()) {
          setError('Contact phone is required');
          return false;
        }
        break;
      case 2: // Property Features
        if (formData.total_floors < 1) {
          setError('Total floors must be at least 1');
          return false;
        }
        break;
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Create a copy of formData for submission
      const submitData = { ...formData };
      
      // For new properties, don't send owner field - let backend set it automatically
      if (!isEdit) {
        delete submitData.owner;
      }

      console.log('Submitting property data:', submitData);

      if (isEdit) {
        await enhancedAPI.branches.update(property.id, submitData);
      } else {
        await enhancedAPI.branches.create(submitData);
      }

      onSave();
      handleClose();
    } catch (error) {
      console.error('Error saving property:', error);
      console.error('Error details:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to save property');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setError('');
    setFormData({
      name: '',
      description: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      contact_phone: '',
      contact_email: '',
      owner: '',
      is_active: true,
      property_type: 'ladies_hostel',
      total_floors: 1,
      num_rooms: '',
      num_bathrooms: '',
      has_parking: false,
      has_wifi: false,
      has_ac: false,
      has_laundry: false,
      has_security: false,
      has_mess: false,
      amenities: '',
      rules_and_regulations: '',
      nearby_facilities: '',
      emergency_contact: '',
      established_year: new Date().getFullYear(),
      established_date: '',
      license_number: '',
      notes: ''
    });
    onClose();
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Property Name *"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address *"
                multiline
                rows={2}
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Pincode"
                value={formData.pincode}
                onChange={(e) => handleInputChange('pincode', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Property Type</InputLabel>
                <Select
                  value={formData.property_type}
                  label="Property Type"
                  onChange={(e) => handleInputChange('property_type', e.target.value)}
                >
                  <MenuItem value="ladies_hostel">Ladies Hostel</MenuItem>
                  <MenuItem value="mens_hostel">Mens Hostel</MenuItem>
                  <MenuItem value="mixed_hostel">Mixed Hostel</MenuItem>
                  <MenuItem value="guest_house">Guest House</MenuItem>
                  <MenuItem value="pg">Paying Guest</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Established Year"
                value={formData.established_year}
                onChange={(e) => handleInputChange('established_year', parseInt(e.target.value))}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Phone *"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact"
                value={formData.emergency_contact}
                onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="License Number"
                value={formData.license_number}
                onChange={(e) => handleInputChange('license_number', e.target.value)}
              />
            </Grid>
            {userRole === 'admin' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Property Owner</InputLabel>
                  <Select
                    value={formData.owner}
                    label="Property Owner"
                    onChange={(e) => handleInputChange('owner', e.target.value)}
                  >
                    <MenuItem value="">Select Owner</MenuItem>
                    {Array.isArray(owners) && owners.map((owner) => (
                      <MenuItem key={owner.id} value={owner.id}>
                        {owner.first_name} {owner.last_name} ({owner.username})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nearby Facilities"
                multiline
                rows={3}
                value={formData.nearby_facilities}
                onChange={(e) => handleInputChange('nearby_facilities', e.target.value)}
                placeholder="Schools, hospitals, shopping centers, transport hubs..."
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Total Floors *"
                value={formData.total_floors}
                onChange={(e) => handleInputChange('total_floors', parseInt(e.target.value))}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Number of Rooms"
                value={formData.num_rooms}
                onChange={(e) => handleInputChange('num_rooms', parseInt(e.target.value) || '')}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Number of Bathrooms"
                value={formData.num_bathrooms}
                onChange={(e) => handleInputChange('num_bathrooms', parseInt(e.target.value) || '')}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  />
                }
                label="Property is Active"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Property Amenities
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_parking}
                    onChange={(e) => handleInputChange('has_parking', e.target.checked)}
                  />
                }
                label="Parking Available"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_wifi}
                    onChange={(e) => handleInputChange('has_wifi', e.target.checked)}
                  />
                }
                label="WiFi Available"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_ac}
                    onChange={(e) => handleInputChange('has_ac', e.target.checked)}
                  />
                }
                label="AC Available"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_laundry}
                    onChange={(e) => handleInputChange('has_laundry', e.target.checked)}
                  />
                }
                label="Laundry Service"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_security}
                    onChange={(e) => handleInputChange('has_security', e.target.checked)}
                  />
                }
                label="Security Available"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_mess}
                    onChange={(e) => handleInputChange('has_mess', e.target.checked)}
                  />
                }
                label="Mess Facility"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Amenities"
                multiline
                rows={3}
                value={formData.amenities}
                onChange={(e) => handleInputChange('amenities', e.target.value)}
                placeholder="Gym, library, common room, garden..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rules and Regulations"
                multiline
                rows={4}
                value={formData.rules_and_regulations}
                onChange={(e) => handleInputChange('rules_and_regulations', e.target.value)}
                placeholder="Property rules, timings, guest policy..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes or comments..."
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review Property Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Basic Information</Typography>
              <Typography><strong>Name:</strong> {formData.name}</Typography>
              <Typography><strong>Type:</strong> {formData.property_type.replace('_', ' ').toUpperCase()}</Typography>
              <Typography><strong>Address:</strong> {formData.address}</Typography>
              <Typography><strong>City:</strong> {formData.city}</Typography>
              <Typography><strong>State:</strong> {formData.state}</Typography>
              <Typography><strong>Pincode:</strong> {formData.pincode}</Typography>
              <Typography><strong>Floors:</strong> {formData.total_floors}</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Contact Information</Typography>
              <Typography><strong>Phone:</strong> {formData.contact_phone}</Typography>
              <Typography><strong>Email:</strong> {formData.contact_email}</Typography>
              <Typography><strong>Emergency:</strong> {formData.emergency_contact}</Typography>
              <Typography><strong>License:</strong> {formData.license_number}</Typography>
              <Typography><strong>Status:</strong> {formData.is_active ? 'Active' : 'Inactive'}</Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Amenities</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.has_parking && <Chip label="Parking" color="primary" size="small" />}
                {formData.has_wifi && <Chip label="WiFi" color="primary" size="small" />}
                {formData.has_ac && <Chip label="AC" color="primary" size="small" />}
                {formData.has_laundry && <Chip label="Laundry" color="primary" size="small" />}
                {formData.has_security && <Chip label="Security" color="primary" size="small" />}
                {formData.has_mess && <Chip label="Mess" color="primary" size="small" />}
              </Box>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {isEdit ? 'Edit Property' : 'Add New Property'}
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

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
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleBack} 
          disabled={activeStep === 0}
        >
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEdit ? 'Update Property' : 'Create Property')}
          </Button>
        ) : (
          <Button 
            onClick={handleNext} 
            variant="contained"
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default PropertyForm;
