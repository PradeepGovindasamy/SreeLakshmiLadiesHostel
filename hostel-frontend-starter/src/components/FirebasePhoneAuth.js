import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Divider
} from '@mui/material';
import { Phone, Sms, Login } from '@mui/icons-material';

const FirebasePhoneAuth = ({ onAuthSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionInfo, setSessionInfo] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const formatPhoneNumber = (phone) => {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    } else if (cleaned.length === 13 && cleaned.startsWith('+91')) {
      return cleaned;
    }
    
    return phone;
  };

  const sendOTP = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const response = await fetch('/auth/send-otp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: formattedPhone
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSessionInfo(data.session_info);
        setStep('otp');
        setSuccess('OTP sent successfully to your phone number');
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Send OTP error:', err);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const response = await fetch('/auth/verify-otp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: formattedPhone,
          otp: otp,
          session_info: sessionInfo
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens in localStorage
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('profile', JSON.stringify(data.profile));
        
        setSuccess('Login successful!');
        
        // Call the success callback
        if (onAuthSuccess) {
          onAuthSuccess(data);
        }
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Verify OTP error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('phone');
    setPhoneNumber('');
    setOtp('');
    setSessionInfo('');
    setError('');
    setSuccess('');
  };

  return (
    <Card sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <CardContent>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Phone Authentication
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {step === 'phone' 
              ? 'Enter your phone number to receive OTP'
              : 'Enter the OTP sent to your phone'
            }
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Stack spacing={3}>
          {step === 'phone' ? (
            <>
              <TextField
                fullWidth
                label="Phone Number"
                placeholder="Enter 10-digit phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                InputProps={{
                  startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                helperText="Format: 9876543210 (without country code)"
              />
              
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={sendOTP}
                disabled={loading || !phoneNumber.trim()}
                startIcon={loading ? <CircularProgress size={20} /> : <Sms />}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </>
          ) : (
            <>
              <TextField
                fullWidth
                label="OTP"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputProps={{ maxLength: 6 }}
                InputProps={{
                  startAdornment: <Sms sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                helperText={`OTP sent to ${formatPhoneNumber(phoneNumber)}`}
              />
              
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={verifyOTP}
                disabled={loading || otp.length !== 6}
                startIcon={loading ? <CircularProgress size={20} /> : <Login />}
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </Button>
              
              <Divider />
              
              <Button
                fullWidth
                variant="outlined"
                onClick={resetForm}
                disabled={loading}
              >
                Change Phone Number
              </Button>
            </>
          )}
        </Stack>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FirebasePhoneAuth;
