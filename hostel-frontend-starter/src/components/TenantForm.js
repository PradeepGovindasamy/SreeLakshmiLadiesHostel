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
  Avatar,
  InputAdornment,
  Divider
} from '@mui/material';
import { enhancedAPI } from '../api';
import { useUser } from '../contexts/UserContext';

const steps = ['Personal Information', 'Contact & Address', 'Emergency Contacts', 'Room Assignment', 'Documents & Terms', 'Review & Save'];

const occupationTypes = [
  'Student',
  'Working Professional',
  'Job Seeker',
  'Intern',
  'Freelancer',
  'Business Owner',
  'Other'
];

const idProofTypes = [
  { value: 'aadhar', label: 'Aadhar Card' },
  { value: 'pan_card', label: 'PAN Card' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'passport', label: 'Passport' },
  { value: 'voter_id', label: 'Voter ID' }
];

function TenantForm({ open, onClose, onSave, tenant = null, isEdit = false }) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  
  const { getUserRole } = useUser();
  const userRole = getUserRole();

  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    occupation: '',
    organization_name: '',
    designation: '',
    monthly_income: '',
    
    // Address Information
    permanent_address: '',
    permanent_city: '',
    permanent_state: '',
    permanent_pincode: '',
    current_address: '',
    current_city: '',
    current_state: '',
    current_pincode: '',
    same_as_permanent: false,
    
    // Emergency Contacts
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    emergency_contact_address: '',
    guardian_name: '',
    guardian_contact: '',
    guardian_relation: '',
    
    // Room Assignment
    branch: '',
    room: '',
    join_date: '',
    leave_date: '',
    rent_amount: '',
    security_deposit: '',
    
    // Documents & Verification
    id_proof_type: '',
    id_proof_number: '',
    has_police_verification: false,
    police_verification_date: '',
    has_medical_certificate: false,
    medical_certificate_date: '',
    reference_name: '',
    reference_contact: '',
    reference_relation: '',
    
    // Terms & Conditions
    agreed_to_terms: false,
    agreed_to_rules: false,
    agreed_to_privacy: false,
    
    // Additional Information
    food_preferences: '',
    medical_conditions: '',
    special_requirements: '',
    notes: '',
    status: 'active'
  });

  useEffect(() => {
    if (open) {
      // Initialize form with proper async handling
      const initializeForm = async () => {
        await fetchBranches();
        
        if (isEdit && tenant) {
          console.log('Editing tenant with data:', tenant);
          console.log('Tenant vacating_date:', tenant.vacating_date);
          console.log('Tenant joining_date:', tenant.joining_date);
          setFormData({
            name: tenant.name || '',
            email: tenant.email || '',
            phone: tenant.phone_number || '', // Map from backend field
            date_of_birth: tenant.date_of_birth || '',
            gender: tenant.gender || '',
            occupation: tenant.occupation || '',
            organization_name: tenant.organization_name || '',
            designation: tenant.designation || '',
            monthly_income: tenant.monthly_income || '',
            permanent_address: tenant.address || '', // Map from backend field
            permanent_city: tenant.permanent_city || '',
            permanent_state: tenant.permanent_state || '',
            permanent_pincode: tenant.permanent_pincode || '',
            current_address: tenant.address || '', // Map from backend field
            current_city: tenant.current_city || '',
            current_state: tenant.current_state || '',
            current_pincode: tenant.current_pincode || '',
            same_as_permanent: tenant.same_as_permanent || false,
            emergency_contact_name: tenant.emergency_contact_name || '',
            emergency_contact_phone: tenant.emergency_contact_phone || '',
            emergency_contact_relation: tenant.emergency_contact_relation || '',
            emergency_contact_address: tenant.emergency_contact_address || '',
            guardian_name: tenant.guardian_name || '',
            guardian_contact: tenant.guardian_contact || '',
            guardian_relation: tenant.guardian_relation || '',
            // Backend returns room_detail (full object) and room (ID)
            // room_detail.branch is the full branch object with id
            branch: tenant.room_detail?.branch?.id || tenant.room?.branch?.id || tenant.room?.branch || '', 
            room: tenant.room_detail?.id || tenant.room?.id || tenant.room || '', // Get room ID from room_detail first
            join_date: tenant.joining_date || '', // Map from backend field
            leave_date: tenant.vacating_date || '', // Map from backend field
            rent_amount: tenant.rent_amount || '',
            security_deposit: tenant.security_deposit || '',
            id_proof_type: tenant.id_proof_type || '',
            id_proof_number: tenant.id_proof_number || '',
            has_police_verification: tenant.has_police_verification || false,
            police_verification_date: tenant.police_verification_date || '',
            has_medical_certificate: tenant.has_medical_certificate || false,
            medical_certificate_date: tenant.medical_certificate_date || '',
            reference_name: tenant.reference_name || '',
            reference_contact: tenant.reference_contact || '',
            reference_relation: tenant.reference_relation || '',
            agreed_to_terms: tenant.agreed_to_terms || false,
            agreed_to_rules: tenant.agreed_to_rules || false,
            agreed_to_privacy: tenant.agreed_to_privacy || false,
            food_preferences: tenant.food_preferences || '',
            medical_conditions: tenant.medical_conditions || '',
            special_requirements: tenant.special_requirements || '',
            notes: tenant.notes || '',
            status: tenant.status || 'active'
          });
          
          // Fetch rooms for the tenant's branch if available
          // Backend returns room_detail with full branch object
          const branchId = tenant.room_detail?.branch?.id || tenant.room?.branch?.id || tenant.room?.branch;
          console.log('Branch ID for fetching rooms:', branchId, 'from tenant.room_detail:', tenant.room_detail);
          if (branchId) {
            await fetchRooms(branchId);
          }
        }
      };
      
      initializeForm();
    }
  }, [open, isEdit, tenant]);

  const fetchBranches = async () => {
    try {
      const response = await enhancedAPI.branches.list();
      console.log('Fetched branches for tenant form:', response.data);
      setBranches(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError('Failed to load properties. Please check your permissions.');
      return [];
    }
  };

  const fetchRooms = async (branchId) => {
    try {
      const response = await enhancedAPI.rooms.list({ branch: branchId });
      console.log('Fetched rooms for tenant form:', response.data);
      setRooms(response.data);
      // Filter available rooms (not at full capacity)
      const available = response.data.filter(room => 
        room.is_available && 
        (room.current_occupancy || 0) < (room.sharing_type || 1)
      );
      console.log('Available rooms:', available);
      setAvailableRooms(available);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-fill current address if same as permanent
      if (field === 'same_as_permanent' && value) {
        newData.current_address = prev.permanent_address;
        newData.current_city = prev.permanent_city;
        newData.current_state = prev.permanent_state;
        newData.current_pincode = prev.permanent_pincode;
      }
      
      // Fetch rooms when branch changes
      if (field === 'branch' && value) {
        fetchRooms(value);
        newData.room = ''; // Reset room selection
      }
      
      // Auto-fill rent amount when room is selected
      if (field === 'room' && value) {
        const selectedRoom = rooms.find(room => room.id === value);
        if (selectedRoom) {
          newData.rent_amount = selectedRoom.rent || '';
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
      case 0: // Personal Information
        if (!formData.name.trim()) {
          setError('Name is required');
          return false;
        }
        if (!formData.phone.trim()) {
          setError('Phone number is required');
          return false;
        }
        if (!formData.email.trim()) {
          setError('Email is required');
          return false;
        }
        break;
      case 1: // Contact & Address
        if (!formData.permanent_address.trim()) {
          setError('Permanent address is required');
          return false;
        }
        break;
      case 2: // Emergency Contacts
        if (!formData.emergency_contact_name.trim()) {
          setError('Emergency contact name is required');
          return false;
        }
        if (!formData.emergency_contact_phone.trim()) {
          setError('Emergency contact phone is required');
          return false;
        }
        break;
      case 3: // Room Assignment
        if (!formData.branch) {
          setError('Please select a property');
          return false;
        }
        if (!formData.room) {
          setError('Please select a room');
          return false;
        }
        if (!formData.join_date) {
          setError('Join date is required');
          return false;
        }
        break;
      case 4: // Documents & Terms
        if (!formData.agreed_to_terms || !formData.agreed_to_rules || !formData.agreed_to_privacy) {
          setError('Please agree to all terms and conditions');
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

      // Map frontend form data to backend field names
      const submitData = {
        name: formData.name,
        email: formData.email,
        phone_number: formData.phone, // Map frontend phone to backend phone_number
        address: formData.current_address || formData.permanent_address, // Use current address or fallback to permanent
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        stay_type: 'monthly', // Default to monthly for now
        joining_date: formData.join_date, // Map frontend join_date to backend joining_date
        vacating_date: formData.leave_date || null, // Map frontend leave_date to backend vacating_date
        room: formData.room, // Room ID
        id_proof_type: formData.id_proof_type,
        id_proof_number: formData.id_proof_number
      };

      console.log('Submitting tenant data:', submitData);

      if (isEdit) {
        await enhancedAPI.tenants.update(tenant.id, submitData);
      } else {
        await enhancedAPI.tenants.create(submitData);
      }

      onSave();
      handleClose();
    } catch (error) {
      console.error('Error saving tenant:', error);
      setError(error.response?.data?.message || 'Failed to save tenant information');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setError('');
    setFormData({
      name: '', email: '', phone: '', date_of_birth: '', gender: '', occupation: '',
      organization_name: '', designation: '', monthly_income: '',
      permanent_address: '', permanent_city: '', permanent_state: '', permanent_pincode: '',
      current_address: '', current_city: '', current_state: '', current_pincode: '',
      same_as_permanent: false, emergency_contact_name: '', emergency_contact_phone: '',
      emergency_contact_relation: '', emergency_contact_address: '', guardian_name: '',
      guardian_contact: '', guardian_relation: '', branch: '', room: '', join_date: '',
      leave_date: '', rent_amount: '', security_deposit: '', id_proof_type: '',
      id_proof_number: '', has_police_verification: false, police_verification_date: '',
      has_medical_certificate: false, medical_certificate_date: '', reference_name: '',
      reference_contact: '', reference_relation: '', agreed_to_terms: false,
      agreed_to_rules: false, agreed_to_privacy: false, food_preferences: '',
      medical_conditions: '', special_requirements: '', notes: '', status: 'active'
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
                label="Full Name *"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number *"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={formData.gender}
                  label="Gender"
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                >
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Occupation</InputLabel>
                <Select
                  value={formData.occupation}
                  label="Occupation"
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                >
                  {occupationTypes.map((type) => (
                    <MenuItem key={type} value={type.toLowerCase().replace(' ', '_')}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Organization/College Name"
                value={formData.organization_name}
                onChange={(e) => handleInputChange('organization_name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Designation/Course"
                value={formData.designation}
                onChange={(e) => handleInputChange('designation', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Monthly Income"
                value={formData.monthly_income}
                onChange={(e) => handleInputChange('monthly_income', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Permanent Address
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Permanent Address *"
                multiline
                rows={2}
                value={formData.permanent_address}
                onChange={(e) => handleInputChange('permanent_address', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.permanent_city}
                onChange={(e) => handleInputChange('permanent_city', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.permanent_state}
                onChange={(e) => handleInputChange('permanent_state', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Pincode"
                value={formData.permanent_pincode}
                onChange={(e) => handleInputChange('permanent_pincode', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.same_as_permanent}
                    onChange={(e) => handleInputChange('same_as_permanent', e.target.checked)}
                  />
                }
                label="Current address is same as permanent address"
              />
            </Grid>
            
            {!formData.same_as_permanent && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Current Address
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Address"
                    multiline
                    rows={2}
                    value={formData.current_address}
                    onChange={(e) => handleInputChange('current_address', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.current_city}
                    onChange={(e) => handleInputChange('current_city', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="State"
                    value={formData.current_state}
                    onChange={(e) => handleInputChange('current_state', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Pincode"
                    value={formData.current_pincode}
                    onChange={(e) => handleInputChange('current_pincode', e.target.value)}
                  />
                </Grid>
              </>
            )}
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Emergency Contact
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact Name *"
                value={formData.emergency_contact_name}
                onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact Phone *"
                value={formData.emergency_contact_phone}
                onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Relation"
                value={formData.emergency_contact_relation}
                onChange={(e) => handleInputChange('emergency_contact_relation', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Emergency Contact Address"
                multiline
                rows={2}
                value={formData.emergency_contact_address}
                onChange={(e) => handleInputChange('emergency_contact_address', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Guardian Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Guardian Name"
                value={formData.guardian_name}
                onChange={(e) => handleInputChange('guardian_name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Guardian Contact"
                value={formData.guardian_contact}
                onChange={(e) => handleInputChange('guardian_contact', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Guardian Relation"
                value={formData.guardian_relation}
                onChange={(e) => handleInputChange('guardian_relation', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      case 3:
        console.log('Step 3 - Room & Stay Details - Current formData:', formData);
        console.log('Step 3 - join_date:', formData.join_date, 'leave_date:', formData.leave_date);
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
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
              <FormControl fullWidth required>
                <InputLabel>Room *</InputLabel>
                <Select
                  value={formData.room}
                  label="Room *"
                  onChange={(e) => handleInputChange('room', e.target.value)}
                  disabled={!formData.branch}
                >
                  {availableRooms.map((room) => (
                    <MenuItem key={room.id} value={room.id}>
                      {room.room_name} ({room.sharing_type_display || `${room.sharing_type}-Sharing`} - {room.current_occupancy || 0}/{room.sharing_type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Stay Period
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Joining Date *"
                type="date"
                value={formData.join_date}
                onChange={(e) => handleInputChange('join_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
                helperText="Date when tenant joined/will join"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vacating/Leave Date"
                type="date"
                value={formData.leave_date || ''}
                onChange={(e) => handleInputChange('leave_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText={formData.leave_date ? `Tenant vacating on: ${new Date(formData.leave_date).toLocaleDateString()}` : 'Leave empty if tenant is not leaving. Set date to mark tenant as leaving/vacated.'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: formData.leave_date ? '#fff3cd' : 'inherit',
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Payment Details
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Monthly Rent"
                value={formData.rent_amount}
                onChange={(e) => handleInputChange('rent_amount', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
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
          </Grid>
        );

      case 4:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Identity Documents
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>ID Proof Type</InputLabel>
                <Select
                  value={formData.id_proof_type}
                  label="ID Proof Type"
                  onChange={(e) => handleInputChange('id_proof_type', e.target.value)}
                >
                  {idProofTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ID Proof Number"
                value={formData.id_proof_number}
                onChange={(e) => handleInputChange('id_proof_number', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_police_verification}
                    onChange={(e) => handleInputChange('has_police_verification', e.target.checked)}
                  />
                }
                label="Police Verification Done"
              />
            </Grid>
            {formData.has_police_verification && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Police Verification Date"
                  type="date"
                  value={formData.police_verification_date}
                  onChange={(e) => handleInputChange('police_verification_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Terms & Conditions
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.agreed_to_terms}
                    onChange={(e) => handleInputChange('agreed_to_terms', e.target.checked)}
                  />
                }
                label="I agree to the terms and conditions *"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.agreed_to_rules}
                    onChange={(e) => handleInputChange('agreed_to_rules', e.target.checked)}
                  />
                }
                label="I agree to abide by the hostel rules and regulations *"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.agreed_to_privacy}
                    onChange={(e) => handleInputChange('agreed_to_privacy', e.target.checked)}
                  />
                }
                label="I agree to the privacy policy *"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional information or special requirements..."
              />
            </Grid>
          </Grid>
        );

      case 5:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review Tenant Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Personal Information</Typography>
              <Typography><strong>Name:</strong> {formData.name}</Typography>
              <Typography><strong>Email:</strong> {formData.email}</Typography>
              <Typography><strong>Phone:</strong> {formData.phone}</Typography>
              <Typography><strong>Gender:</strong> {formData.gender}</Typography>
              <Typography><strong>Occupation:</strong> {formData.occupation}</Typography>
              {formData.organization_name && (
                <Typography><strong>Organization:</strong> {formData.organization_name}</Typography>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Room Assignment</Typography>
              <Typography><strong>Property:</strong> {branches.find(b => b.id === formData.branch)?.name}</Typography>
              <Typography><strong>Room:</strong> {rooms.find(r => r.id === formData.room)?.room_name}</Typography>
              <Typography><strong>Join Date:</strong> {formData.join_date}</Typography>
              <Typography><strong>Monthly Rent:</strong> ₹{formData.rent_amount}</Typography>
              {formData.security_deposit && (
                <Typography><strong>Security Deposit:</strong> ₹{formData.security_deposit}</Typography>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Emergency Contact</Typography>
              <Typography><strong>Name:</strong> {formData.emergency_contact_name}</Typography>
              <Typography><strong>Phone:</strong> {formData.emergency_contact_phone}</Typography>
              <Typography><strong>Relation:</strong> {formData.emergency_contact_relation}</Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Agreements</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.agreed_to_terms && <Chip label="Terms Accepted" color="success" size="small" />}
                {formData.agreed_to_rules && <Chip label="Rules Accepted" color="success" size="small" />}
                {formData.agreed_to_privacy && <Chip label="Privacy Accepted" color="success" size="small" />}
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
        {isEdit ? 'Edit Tenant Information' : 'Tenant Onboarding'}
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
            {loading ? 'Saving...' : (isEdit ? 'Update Tenant' : 'Complete Onboarding')}
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

export default TenantForm;
