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
  Chip,
  Slider,
  InputAdornment
} from '@mui/material';
import { enhancedAPI } from '../api';
import { useUser } from '../contexts/UserContext';

const steps = ['Basic Information', 'Room Details', 'Pricing & Features', 'Review & Save'];

const roomTypes = [
  { value: 'single', label: 'One Sharing' },
  { value: 'double', label: 'Two Sharing' },
  { value: 'triple', label: 'Three Sharing' },
  { value: 'quad', label: 'Four Sharing' },
  { value: 'quintuple', label: 'Five Sharing' },
  { value: 'sextuple', label: 'Six Sharing' },
  { value: 'septuple', label: 'Seven Sharing' },
  { value: 'octuple', label: 'Eight Sharing' }
];

const roomStatuses = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'maintenance', label: 'Under Maintenance' },
  { value: 'reserved', label: 'Reserved' }
];

function RoomForm({ open, onClose, onSave, room = null, copyFromRoom = null, isEdit = false }) {
  // Map backend sharing_type integer to frontend room_type string
  const mapSharingTypeToRoomType = (sharingType) => {
    const mapping = {
      1: 'single',
      2: 'double', 
      3: 'triple',
      4: 'quad',
      5: 'quintuple',
      6: 'sextuple',
      7: 'septuple',
      8: 'octuple'
    };
    return mapping[sharingType] || 'double';
  };

  // Map frontend room_type string to backend sharing_type integer
  const mapRoomTypeToSharingType = (roomType) => {
    const mapping = {
      'single': 1,
      'double': 2,
      'triple': 3, 
      'quad': 4,
      'quintuple': 5,
      'sextuple': 6,
      'septuple': 7,
      'octuple': 8
    };
    return mapping[roomType] || 2;
  };

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [branches, setBranches] = useState([]);
  
  const { getUserRole } = useUser();
  const userRole = getUserRole();

  const [formData, setFormData] = useState({
    room_number: '',
    room_name: '',
    branch: '',
    room_type: 'double',
    capacity: 2,
    current_occupancy: 0,
    floor: 1,
    area_sqft: '',
    rent_amount: '',
    security_deposit: '',
    status: 'available',
    description: '',
    is_ac: false,
    has_attached_bathroom: false,
    has_balcony: false,
    has_window: true,
    has_fan: true,
    has_light: true,
    has_power_outlet: true,
    has_study_table: false,
    has_chair: false,
    has_wardrobe: false,
    has_bed: true,
    furniture_details: '',
    amenities: '',
    maintenance_notes: '',
    last_maintenance_date: '',
    next_maintenance_date: '',
    room_images: '',
    special_features: '',
    restrictions: '',
    is_available: true
  });

  useEffect(() => {
    if (open) {
      // Always fetch branches when dialog opens
      const initializeForm = async () => {
        await fetchBranches();
        
        // Set form data after branches are loaded
        if (isEdit && room) {
          console.log('Editing room with data:', room);
          console.log('Room branch field:', room.branch);
          console.log('Room branch_detail:', room.branch_detail);
          console.log('Room sharing_type:', room.sharing_type);
          console.log('Available branches:', branches);
          
          setFormData({
            room_number: room.room_name || '',
            room_name: room.room_name || '',
            // Handle branch mapping - use branch field directly since we removed write_only
            branch: room.branch || room.branch_detail?.id || '',
            // Map sharing_type number to room_type string
            room_type: mapSharingTypeToRoomType(room.sharing_type),
            capacity: room.sharing_type || 2,
            current_occupancy: room.current_occupancy || 0,
            floor: room.floor_number || 1,
            area_sqft: room.room_size_sqft || '',
            rent_amount: room.rent || '',
            security_deposit: '', // Not in backend model yet
            status: room.is_available ? 'available' : 'unavailable',
            description: '', // Not in backend model yet
            is_ac: room.ac_room || false,
            has_attached_bathroom: room.attached_bath || false,
            // These fields don't exist in backend model, set defaults
            has_balcony: false,
            has_window: true,
            has_fan: true,
            has_light: true,
            has_power_outlet: true,
            has_study_table: false,
            has_chair: false,
            has_wardrobe: false,
            has_bed: true,
            furniture_details: '',
            amenities: '',
            maintenance_notes: '',
            last_maintenance_date: '',
            next_maintenance_date: '',
            room_images: '',
            special_features: '',
            restrictions: '',
            is_available: room.is_available !== undefined ? room.is_available : true
          });
          
          console.log('Form data after setting:', {
            branch: room.branch || room.branch_detail?.id || '',
            room_type: mapSharingTypeToRoomType(room.sharing_type),
            capacity: room.sharing_type || 2
          });
        } else if (copyFromRoom) {
          // Copy mode: populate form with source room data but clear unique fields
          console.log('Copying from room:', copyFromRoom);
          
          setFormData({
            room_number: '', // Clear room number for new room
            room_name: '', // Clear room name for new room
            // Keep same branch as source room
            branch: copyFromRoom.branch || copyFromRoom.branch_detail?.id || '',
            // Copy room type and capacity
            room_type: mapSharingTypeToRoomType(copyFromRoom.sharing_type),
            capacity: copyFromRoom.sharing_type || 2,
            current_occupancy: 0, // Reset occupancy for new room
            floor: copyFromRoom.floor_number || 1,
            area_sqft: copyFromRoom.room_size_sqft || '',
            rent_amount: copyFromRoom.rent || '',
            security_deposit: '', // Not in backend model yet
            status: 'available', // New room should be available
            description: '', // Not in backend model yet
            is_ac: copyFromRoom.ac_room || false,
            has_attached_bathroom: copyFromRoom.attached_bath || false,
            // These fields don't exist in backend model, set defaults
            has_balcony: false,
            has_window: true,
            has_fan: true,
            has_light: true,
            has_power_outlet: true,
            has_study_table: false,
            has_chair: false,
            has_wardrobe: false,
            has_bed: true,
            furniture_details: '',
            amenities: '',
            maintenance_notes: '',
            last_maintenance_date: '',
            next_maintenance_date: '',
            room_images: '',
            special_features: '',
            restrictions: '',
            is_available: true // New room should be available
          });
          
          console.log('Form data copied from:', copyFromRoom.room_name);
        }
      };
      
      initializeForm();
    }
  }, [open, isEdit, room, copyFromRoom]);

  const fetchBranches = async () => {
    try {
      const response = await enhancedAPI.branches.list();
      console.log('Fetched branches for room form:', response.data);
      setBranches(response.data);
      return response.data; // Return the branches data
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError('Failed to load properties.');
      return [];
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-update capacity based on room type
      if (field === 'room_type') {
        switch (value) {
          case 'single':
            newData.capacity = 1;
            break;
          case 'double':
            newData.capacity = 2;
            break;
          case 'triple':
            newData.capacity = 3;
            break;
          case 'quad':
            newData.capacity = 4;
            break;
          case 'quintuple':
            newData.capacity = 5;
            break;
          case 'sextuple':
            newData.capacity = 6;
            break;
          case 'dormitory':
            newData.capacity = 6;
            break;
          default:
            newData.capacity = 2;
        }
      }
      
      return newData;
    });
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
        if (!formData.room_number.trim()) {
          setError('Room number is required');
          return false;
        }
        if (!formData.branch) {
          setError('Please select a property');
          return false;
        }
        break;
      case 1: // Room Details
        if (formData.capacity < 1) {
          setError('Capacity must be at least 1');
          return false;
        }
        if (formData.current_occupancy > formData.capacity) {
          setError('Current occupancy cannot exceed capacity');
          return false;
        }
        break;
      case 2: // Pricing & Features
        if (!formData.rent_amount || formData.rent_amount <= 0) {
          setError('Valid rent amount is required');
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

      const submitData = {
        room_name: formData.room_number, // Map frontend room_number to backend room_name
        branch: formData.branch,
        sharing_type: mapRoomTypeToSharingType(formData.room_type), // Map frontend room_type to backend sharing_type
        floor_number: parseInt(formData.floor), // Map frontend floor to backend floor_number
        rent: parseFloat(formData.rent_amount), // Map frontend rent_amount to backend rent
        room_size_sqft: formData.area_sqft ? parseFloat(formData.area_sqft) : null, // Map frontend area_sqft to backend room_size_sqft
        is_available: formData.status === 'available', // Map frontend status to backend is_available
        ac_room: formData.is_ac, // Map frontend is_ac to backend ac_room
        attached_bath: formData.has_attached_bathroom, // Map frontend has_attached_bathroom to backend attached_bath
        // Note: Other fields like description, furniture details etc. don't exist in backend model yet
      };

      console.log('Submitting room data:', submitData);

      if (isEdit) {
        await enhancedAPI.rooms.update(room.id, submitData);
      } else {
        await enhancedAPI.rooms.create(submitData);
      }

      onSave();
      handleClose();
    } catch (error) {
      console.error('Error saving room:', error);
      setError(error.response?.data?.message || 'Failed to save room');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setError('');
    setFormData({
      room_number: '',
      room_name: '',
      branch: '',
      room_type: 'double',
      capacity: 2,
      current_occupancy: 0,
      floor: 1,
      area_sqft: '',
      rent_amount: '',
      security_deposit: '',
      status: 'available',
      description: '',
      is_ac: false,
      has_attached_bathroom: false,
      has_balcony: false,
      has_window: true,
      has_fan: true,
      has_light: true,
      has_power_outlet: true,
      has_study_table: false,
      has_chair: false,
      has_wardrobe: false,
      has_bed: true,
      furniture_details: '',
      amenities: '',
      maintenance_notes: '',
      last_maintenance_date: '',
      next_maintenance_date: '',
      room_images: '',
      special_features: '',
      restrictions: '',
      is_available: true
    });
    onClose();
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Room Number *"
                value={formData.room_number}
                onChange={(e) => handleInputChange('room_number', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Room Name"
                value={formData.room_name}
                onChange={(e) => handleInputChange('room_name', e.target.value)}
                placeholder="Optional display name"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Property *</InputLabel>
                <Select
                  value={formData.branch}
                  label="Property *"
                  onChange={(e) => handleInputChange('branch', e.target.value)}
                >
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Room Type</InputLabel>
                <Select
                  value={formData.room_type}
                  label="Room Type"
                  onChange={(e) => handleInputChange('room_type', e.target.value)}
                >
                  {roomTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  {roomStatuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of the room..."
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Floor"
                value={formData.floor}
                onChange={(e) => handleInputChange('floor', parseInt(e.target.value))}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Capacity *"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', parseInt(e.target.value))}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Current Occupancy"
                value={formData.current_occupancy}
                InputProps={{
                  readOnly: true,
                }}
                helperText="Automatically calculated from tenant assignments"
                inputProps={{ min: 0, max: formData.capacity }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Area (sq ft)"
                value={formData.area_sqft}
                onChange={(e) => handleInputChange('area_sqft', e.target.value)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">sq ft</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_available}
                    onChange={(e) => handleInputChange('is_available', e.target.checked)}
                  />
                }
                label="Room is Available for Booking"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Facilities
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_attached_bathroom}
                    onChange={(e) => handleInputChange('has_attached_bathroom', e.target.checked)}
                  />
                }
                label="Attached Bathroom"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_balcony}
                    onChange={(e) => handleInputChange('has_balcony', e.target.checked)}
                  />
                }
                label="Balcony"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_window}
                    onChange={(e) => handleInputChange('has_window', e.target.checked)}
                  />
                }
                label="Window"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_fan}
                    onChange={(e) => handleInputChange('has_fan', e.target.checked)}
                  />
                }
                label="Ceiling Fan"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_light}
                    onChange={(e) => handleInputChange('has_light', e.target.checked)}
                  />
                }
                label="Lighting"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_power_outlet}
                    onChange={(e) => handleInputChange('has_power_outlet', e.target.checked)}
                  />
                }
                label="Power Outlets"
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Monthly Rent *"
                value={formData.rent_amount}
                onChange={(e) => handleInputChange('rent_amount', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Security Deposit"
                value={formData.security_deposit}
                onChange={(e) => handleInputChange('security_deposit', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Furniture & Features
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_ac}
                    onChange={(e) => handleInputChange('is_ac', e.target.checked)}
                  />
                }
                label="Air Conditioning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_bed}
                    onChange={(e) => handleInputChange('has_bed', e.target.checked)}
                  />
                }
                label="Bed(s)"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_study_table}
                    onChange={(e) => handleInputChange('has_study_table', e.target.checked)}
                  />
                }
                label="Study Table"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_chair}
                    onChange={(e) => handleInputChange('has_chair', e.target.checked)}
                  />
                }
                label="Chair(s)"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_wardrobe}
                    onChange={(e) => handleInputChange('has_wardrobe', e.target.checked)}
                  />
                }
                label="Wardrobe"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Furniture Details"
                multiline
                rows={3}
                value={formData.furniture_details}
                onChange={(e) => handleInputChange('furniture_details', e.target.value)}
                placeholder="Detailed description of furniture and fixtures..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Special Features"
                multiline
                rows={2}
                value={formData.special_features}
                onChange={(e) => handleInputChange('special_features', e.target.value)}
                placeholder="Any special features or highlights..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Restrictions"
                multiline
                rows={2}
                value={formData.restrictions}
                onChange={(e) => handleInputChange('restrictions', e.target.value)}
                placeholder="Any specific restrictions or requirements..."
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review Room Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Basic Information</Typography>
              <Typography><strong>Room Number:</strong> {formData.room_number}</Typography>
              <Typography><strong>Room Name:</strong> {formData.room_name || 'N/A'}</Typography>
              <Typography><strong>Property:</strong> {branches.find(b => b.id === formData.branch)?.name}</Typography>
              <Typography><strong>Type:</strong> {roomTypes.find(t => t.value === formData.room_type)?.label}</Typography>
              <Typography><strong>Floor:</strong> {formData.floor}</Typography>
              <Typography><strong>Status:</strong> {roomStatuses.find(s => s.value === formData.status)?.label}</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Capacity & Pricing</Typography>
              <Typography><strong>Capacity:</strong> {formData.capacity} people</Typography>
              <Typography><strong>Current Occupancy:</strong> {formData.current_occupancy}</Typography>
              <Typography><strong>Monthly Rent:</strong> ₹{formData.rent_amount}</Typography>
              <Typography><strong>Security Deposit:</strong> ₹{formData.security_deposit || 'N/A'}</Typography>
              {formData.area_sqft && <Typography><strong>Area:</strong> {formData.area_sqft} sq ft</Typography>}
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Features & Amenities</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.is_ac && <Chip label="AC" color="primary" size="small" />}
                {formData.has_attached_bathroom && <Chip label="Attached Bathroom" color="primary" size="small" />}
                {formData.has_balcony && <Chip label="Balcony" color="primary" size="small" />}
                {formData.has_window && <Chip label="Window" color="primary" size="small" />}
                {formData.has_fan && <Chip label="Fan" color="primary" size="small" />}
                {formData.has_bed && <Chip label="Bed" color="primary" size="small" />}
                {formData.has_study_table && <Chip label="Study Table" color="primary" size="small" />}
                {formData.has_chair && <Chip label="Chair" color="primary" size="small" />}
                {formData.has_wardrobe && <Chip label="Wardrobe" color="primary" size="small" />}
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
        {isEdit ? 'Edit Room' : 
         copyFromRoom ? `Copy Room from ${copyFromRoom.room_name}` : 
         'Add New Room'}
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
            {loading ? 'Saving...' : (isEdit ? 'Update Room' : 'Create Room')}
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

export default RoomForm;
