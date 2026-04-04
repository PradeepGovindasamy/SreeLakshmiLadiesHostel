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
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  Paper
} from '@mui/material';
import { Phone, Security, Login } from '@mui/icons-material';
import axios from 'axios';

const PhoneOTPLogin = ({ onLoginSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionInfo, setSessionInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const steps = ['Enter Phone Number', 'Verify OTP', 'Login Complete'];

  const API_BASE_URL = 'http://127.0.0.1:8000/api';

  // Format phone number for display
  const formatPhoneNumber = (number) => {
    if (!number) return '';
    return number.replace(/(\+\d{2})(\d{4})(\d{3})(\d{3})/, '$1 $2 $3 $4');
  };

  // Validate phone number
  const validatePhoneNumber = (number) => {
    const phoneRegex = /^\+\d{10,15}$/;
    return phoneRegex.test(number);
  };

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    setError('');
    setSuccess('');

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number with country code (e.g., +919876543210)');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/send-otp/`, {
        phone_number: phoneNumber
      });

      if (response.data.message === 'OTP sent successfully') {
        setSessionInfo(response.data.session_info);
        setSuccess(`OTP sent successfully to ${formatPhoneNumber(phoneNumber)}`);
        setActiveStep(1);
      }
    } catch (error) {
      console.error('Send OTP Error:', error);
      setError(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to send OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    setError('');
    setSuccess('');

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/verify-otp/`, {
        phone_number: phoneNumber,
        otp: otp,
        session_info: sessionInfo
      });

      if (response.data.message === 'OTP verified successfully') {
        // Store authentication tokens
        localStorage.setItem('access', response.data.access_token);
        localStorage.setItem('refresh', response.data.refresh_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('userProfile', JSON.stringify(response.data.profile));

        setSuccess('OTP verified successfully! Logging you in...');
        setActiveStep(2);

        // Call the success callback after a brief delay
        setTimeout(() => {
          onLoginSuccess(response.data);
        }, 1500);
      }
    } catch (error) {
      console.error('Verify OTP Error:', error);
      setError(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Invalid OTP. Please check and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset to step 1
  const handleBackToPhone = () => {
    setActiveStep(0);
    setOtp('');
    setError('');
    setSuccess('');
  };

  // Handle key press for better UX
  const handleKeyPress = (event, action) => {
    if (event.key === 'Enter') {
      action();
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2
      }}
    >
      <Paper
        elevation={10}
        sx={{
          width: '100%',
          maxWidth: 450,
          borderRadius: 3,
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            color: 'white',
            p: 3,
            textAlign: 'center'
          }}
        >
          <Typography variant="h4" gutterBottom>
            Welcome Back
          </Typography>
          <Typography variant="body1">
            Sree Lakshmi Ladies Hostel
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Error/Success Messages */}
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

          {/* Step 1: Phone Number */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Enter Your Phone Number
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                We'll send you a verification code
              </Typography>

              <TextField
                fullWidth
                label="Phone Number"
                placeholder="+919876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleSendOTP)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone color="primary" />
                    </InputAdornment>
                  ),
                }}
                helperText="Include country code (e.g., +91 for India)"
                sx={{ mb: 3 }}
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSendOTP}
                disabled={loading || !phoneNumber}
                startIcon={loading ? <CircularProgress size={20} /> : <Phone />}
                sx={{ py: 1.5 }}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </Box>
          )}

          {/* Step 2: OTP Verification */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Enter Verification Code
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Code sent to {formatPhoneNumber(phoneNumber)}
              </Typography>

              <TextField
                fullWidth
                label="6-Digit OTP"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                onKeyPress={(e) => handleKeyPress(e, handleVerifyOTP)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Security color="primary" />
                    </InputAdornment>
                  ),
                }}
                inputProps={{
                  style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }
                }}
                sx={{ mb: 3 }}
              />

              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  onClick={handleBackToPhone}
                  disabled={loading}
                  sx={{ flex: 1 }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  startIcon={loading ? <CircularProgress size={20} /> : <Security />}
                  sx={{ flex: 2 }}
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Button>
              </Box>

              <Button
                variant="text"
                onClick={handleSendOTP}
                disabled={loading}
                sx={{ mt: 2, width: '100%' }}
              >
                Didn't receive code? Resend OTP
              </Button>
            </Box>
          )}

          {/* Step 3: Success */}
          {activeStep === 2 && (
            <Box textAlign="center">
              <Login color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Login Successful!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Redirecting to your dashboard...
              </Typography>
              <CircularProgress sx={{ mt: 2 }} />
            </Box>
          )}
        </CardContent>
      </Paper>
    </Box>
  );
};

export default PhoneOTPLogin;
                    