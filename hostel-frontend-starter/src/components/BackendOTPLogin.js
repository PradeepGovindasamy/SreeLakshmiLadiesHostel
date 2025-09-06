import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  Paper,
  Card,
  CardContent
} from '@mui/material';
import { Phone, Security } from '@mui/icons-material';
import axios from 'axios';

const BackendOTPLogin = ({ onLoginSuccess }) => {
  const [step, setStep] = useState(1); // 1: phone, 2: otp
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sessionInfo, setSessionInfo] = useState('');

  const API_BASE_URL = 'http://127.0.0.1:8000/api';

  const validatePhoneNumber = (number) => {
    const phoneRegex = /^\+\d{10,15}$/;
    return phoneRegex.test(number);
  };

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
        setSuccess(`For testing: Use OTP "123456" for any phone number`);
        setStep(2);
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

        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          onLoginSuccess(response.data);
        }, 1000);
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

  const handleBack = () => {
    setStep(1);
    setOtp('');
    setError('');
    setSuccess('');
    setSessionInfo('');
  };

  return (
    <Paper elevation={3} sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom textAlign="center">
            Phone OTP Login
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Development Mode:</strong> Use OTP "123456" for any phone number.
              Real SMS requires Firebase billing setup.
            </Typography>
          </Alert>

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

          {step === 1 && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Enter your phone number to receive an OTP
              </Typography>

              <TextField
                fullWidth
                label="Phone Number"
                placeholder="+919876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone />
                    </InputAdornment>
                  ),
                }}
                helperText="Include country code (e.g., +91 for India)"
                sx={{ mb: 3 }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleSendOTP}
                disabled={loading || !phoneNumber}
                startIcon={loading ? <CircularProgress size={20} /> : <Phone />}
                sx={{ py: 1.5 }}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </Button>

              <Typography variant="caption" display="block" sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
                No real SMS will be sent. Use "123456" as OTP for testing.
              </Typography>
            </Box>
          )}

          {step === 2 && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Enter the verification code
              </Typography>
              
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Test OTP:</strong> Enter "123456" to verify
                </Typography>
              </Alert>

              <TextField
                fullWidth
                label="Verification Code"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Security />
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
                  onClick={handleBack}
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
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>
              </Box>

              <Button
                variant="text"
                onClick={handleBack}
                disabled={loading}
                sx={{ mt: 2, width: '100%' }}
              >
                Didn't receive code? Try again
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Paper>
  );
};

export default BackendOTPLogin;
