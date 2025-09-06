import React, { useState, useRef, useEffect } from 'react';
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
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../config/firebase';
import axios from 'axios';

const SimpleFirebasePhoneOTP = ({ onLoginSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  const recaptchaRef = useRef(null);
  const recaptchaResolved = useRef(false);

  const steps = ['Enter Phone Number', 'Verify OTP', 'Login Complete'];
  const API_BASE_URL = 'http://127.0.0.1:8000/api';

  // Initialize reCAPTCHA only once
  useEffect(() => {
    const initializeRecaptcha = () => {
      // Wait for DOM element to be available
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (recaptchaContainer && !recaptchaRef.current) {
        try {
          recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'normal',
            callback: (response) => {
              console.log('reCAPTCHA solved');
              recaptchaResolved.current = true;
            },
            'expired-callback': () => {
              console.log('reCAPTCHA expired');
              recaptchaResolved.current = false;
              setError('reCAPTCHA expired. Please solve it again.');
            }
          });
          
          // Render the reCAPTCHA
          recaptchaRef.current.render().then(() => {
            console.log('reCAPTCHA rendered successfully');
          }).catch((error) => {
            console.error('Error rendering reCAPTCHA:', error);
            setError('Failed to load reCAPTCHA. Please refresh the page.');
          });
          
        } catch (error) {
          console.error('Error initializing reCAPTCHA:', error);
          setError('Failed to initialize reCAPTCHA. Please refresh the page.');
        }
      }
    };

    // Delay initialization to ensure DOM is ready
    const timer = setTimeout(initializeRecaptcha, 500);

    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch (error) {
          console.log('Cleanup error:', error);
        }
        recaptchaRef.current = null;
      }
    };
  }, []);

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

  // Step 1: Send OTP using Firebase
  const handleSendOTP = async () => {
    setError('');
    setSuccess('');

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number with country code (e.g., +919876543210)');
      return;
    }

    if (!recaptchaResolved.current) {
      setError('Please complete the reCAPTCHA verification first.');
      return;
    }

    if (!recaptchaRef.current) {
      setError('reCAPTCHA not initialized. Please refresh the page and wait for it to load.');
      return;
    }

    setLoading(true);

    try {
      // Send OTP using Firebase
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaRef.current);
      setConfirmationResult(confirmation);
      setSuccess(`OTP sent successfully to ${formatPhoneNumber(phoneNumber)}`);
      setActiveStep(1);
    } catch (error) {
      console.error('Error sending OTP:', error);
      
      // Handle specific Firebase errors
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later.';
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'reCAPTCHA verification failed. Please try again.';
        recaptchaResolved.current = false;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP with Firebase
  const handleVerifyOTP = async () => {
    setError('');
    setSuccess('');

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    if (!confirmationResult) {
      setError('No verification session found. Please request a new OTP.');
      return;
    }

    setLoading(true);

    try {
      // Verify OTP with Firebase
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      // Get Firebase ID token
      const idToken = await user.getIdToken();

      // Send the Firebase ID token to your backend for user creation/login
      const response = await axios.post(`${API_BASE_URL}/auth/firebase-login/`, {
        id_token: idToken,
        phone_number: phoneNumber
      });

      if (response.data.access_token) {
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
      console.error('Error verifying OTP:', error);
      
      let errorMessage = 'Invalid OTP. Please check and try again.';
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid verification code.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Verification code has expired. Please request a new one.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setError(errorMessage);
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
    setConfirmationResult(null);
    recaptchaResolved.current = false;
    
    // Reset reCAPTCHA
    if (recaptchaRef.current) {
      try {
        recaptchaRef.current.render();
      } catch (error) {
        console.log('Error resetting reCAPTCHA:', error);
      }
    }
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
            Phone Verification
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
                We'll send you a verification code via SMS
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

              {/* reCAPTCHA container */}
              <Box sx={{ 
                mb: 3, 
                display: 'flex', 
                justifyContent: 'center',
                minHeight: '78px', // Reserve space for reCAPTCHA
                border: '1px dashed #ccc',
                borderRadius: 1,
                alignItems: 'center',
                p: 1
              }}>
                <div id="recaptcha-container" style={{ transform: 'scale(0.9)' }}></div>
                {!recaptchaRef.current && (
                  <Typography variant="body2" color="text.secondary">
                    Loading reCAPTCHA...
                  </Typography>
                )}
              </Box>

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

              <Typography variant="caption" display="block" sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
                {recaptchaResolved.current ? 
                  '✅ reCAPTCHA verified. You can now send OTP.' : 
                  '⏳ Please complete the reCAPTCHA above to continue'
                }
              </Typography>
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
                onClick={handleBackToPhone}
                disabled={loading}
                sx={{ mt: 2, width: '100%' }}
              >
                Didn't receive code? Send new OTP
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

export default SimpleFirebasePhoneOTP;
