import React, { useState, useRef, useEffect } from 'react';
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
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { Phone, Security, ExpandMore } from '@mui/icons-material';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../config/firebase';
import axios from 'axios';

const DiagnosticFirebaseOTP = ({ onLoginSuccess }) => {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState([]);
  
  const recaptchaRef = useRef(null);
  const recaptchaInitialized = useRef(false);

  const API_BASE_URL = 'http://127.0.0.1:8000/api';

  const addDiagnostic = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDiagnosticInfo(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DIAGNOSTIC] ${message}`);
  };

  // Initialize reCAPTCHA
  useEffect(() => {
    const loadRecaptcha = async () => {
      addDiagnostic('Starting reCAPTCHA initialization...');
      
      if (recaptchaInitialized.current) {
        addDiagnostic('reCAPTCHA already initialized, skipping');
        return;
      }

      // Check Firebase auth
      if (!auth) {
        addDiagnostic('ERROR: Firebase auth not initialized');
        setError('Firebase authentication not initialized');
        return;
      }
      addDiagnostic('✅ Firebase auth initialized');

      // Wait for the DOM element
      addDiagnostic('Waiting for DOM element...');
      await new Promise(resolve => {
        const checkElement = () => {
          if (document.getElementById('recaptcha-container')) {
            addDiagnostic('✅ DOM element found');
            resolve();
          } else {
            setTimeout(checkElement, 100);
          }
        };
        checkElement();
      });

      try {
        addDiagnostic('Creating RecaptchaVerifier...');
        recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'normal',
          callback: (response) => {
            addDiagnostic('✅ reCAPTCHA solved successfully');
            setRecaptchaLoaded(true);
            setError('');
          },
          'expired-callback': () => {
            addDiagnostic('❌ reCAPTCHA expired');
            setRecaptchaLoaded(false);
            setError('reCAPTCHA expired. Please solve it again.');
          },
          'error-callback': (error) => {
            addDiagnostic(`❌ reCAPTCHA error: ${error}`);
            setError('reCAPTCHA failed to load. Please refresh the page.');
          }
        });

        addDiagnostic('Rendering reCAPTCHA...');
        await recaptchaRef.current.render();
        recaptchaInitialized.current = true;
        addDiagnostic('✅ reCAPTCHA rendered successfully');
        
      } catch (error) {
        addDiagnostic(`❌ Failed to initialize reCAPTCHA: ${error.message}`);
        setError(`Failed to load reCAPTCHA: ${error.message}`);
      }
    };

    loadRecaptcha();

    return () => {
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
          addDiagnostic('reCAPTCHA cleaned up');
        } catch (e) {
          addDiagnostic(`Cleanup error: ${e.message}`);
        }
      }
      recaptchaInitialized.current = false;
    };
  }, []);

  const validatePhoneNumber = (number) => {
    const phoneRegex = /^\+\d{10,15}$/;
    return phoneRegex.test(number);
  };

  const handleSendOTP = async () => {
    addDiagnostic(`Starting OTP send process for ${phoneNumber}`);
    setError('');
    setSuccess('');

    if (!validatePhoneNumber(phoneNumber)) {
      const errorMsg = 'Invalid phone number format';
      addDiagnostic(`❌ ${errorMsg}`);
      setError('Please enter a valid phone number with country code (e.g., +919876543210)');
      return;
    }
    addDiagnostic('✅ Phone number format valid');

    if (!recaptchaLoaded) {
      const errorMsg = 'reCAPTCHA not completed';
      addDiagnostic(`❌ ${errorMsg}`);
      setError('Please complete the reCAPTCHA verification first.');
      return;
    }
    addDiagnostic('✅ reCAPTCHA verification confirmed');

    if (!recaptchaRef.current) {
      const errorMsg = 'reCAPTCHA reference not available';
      addDiagnostic(`❌ ${errorMsg}`);
      setError('reCAPTCHA not initialized. Please refresh the page.');
      return;
    }
    addDiagnostic('✅ reCAPTCHA reference available');

    setLoading(true);
    addDiagnostic('Calling Firebase signInWithPhoneNumber...');

    try {
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaRef.current);
      addDiagnostic('✅ Firebase OTP sent successfully');
      setConfirmationResult(confirmation);
      setSuccess(`OTP sent to ${phoneNumber}`);
      setStep(2);
    } catch (error) {
      addDiagnostic(`❌ Firebase error: ${error.code} - ${error.message}`);
      
      let errorMessage = 'Failed to send OTP. Please try again.';
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later.';
      } else if (error.code === 'auth/project-not-found') {
        errorMessage = 'Firebase project configuration error.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Phone authentication is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method > Phone.';
      } else if (error.code === 'auth/app-not-authorized') {
        errorMessage = 'This app is not authorized to use Firebase Authentication.';
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'reCAPTCHA verification failed. Please try again.';
      } else {
        errorMessage = `Firebase Error: ${error.code} - ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    addDiagnostic(`Starting OTP verification with code: ${otp}`);
    setError('');
    setSuccess('');

    if (!otp || otp.length !== 6) {
      addDiagnostic('❌ Invalid OTP length');
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      addDiagnostic('Confirming OTP with Firebase...');
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      addDiagnostic('✅ OTP verified with Firebase');
      
      addDiagnostic('Getting Firebase ID token...');
      const idToken = await user.getIdToken();
      addDiagnostic('✅ Firebase ID token obtained');

      addDiagnostic('Sending token to backend...');
      const response = await axios.post(`${API_BASE_URL}/auth/firebase-login/`, {
        id_token: idToken,
        phone_number: phoneNumber
      });

      if (response.data.access_token) {
        addDiagnostic('✅ Backend authentication successful');
        localStorage.setItem('access', response.data.access_token);
        localStorage.setItem('refresh', response.data.refresh_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('userProfile', JSON.stringify(response.data.profile));

        setSuccess('Login successful! Redirecting...');
        setTimeout(() => onLoginSuccess(response.data), 1000);
      }
    } catch (error) {
      addDiagnostic(`❌ Verification error: ${error.code || error.message}`);
      
      let errorMessage = 'Invalid OTP. Please try again.';
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid verification code.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Verification code expired. Please request a new one.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setOtp('');
    setError('');
    setSuccess('');
    setConfirmationResult(null);
  };

  return (
    <Paper elevation={3} sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom textAlign="center">
            Firebase Phone OTP (Diagnostic Mode)
          </Typography>

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

              {/* reCAPTCHA */}
              <Box sx={{ 
                mb: 3, 
                p: 2, 
                border: '1px solid #e0e0e0', 
                borderRadius: 1,
                textAlign: 'center',
                minHeight: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div id="recaptcha-container"></div>
                {!recaptchaInitialized.current && (
                  <Typography variant="body2" color="text.secondary">
                    Loading security verification...
                  </Typography>
                )}
              </Box>

              <Typography variant="caption" display="block" sx={{ mb: 2, textAlign: 'center' }}>
                {recaptchaLoaded ? 
                  '✅ Security verified. Ready to send OTP.' : 
                  '⏳ Please complete the security check above'
                }
              </Typography>

              <Button
                fullWidth
                variant="contained"
                onClick={handleSendOTP}
                disabled={loading || !phoneNumber || !recaptchaLoaded}
                startIcon={loading ? <CircularProgress size={20} /> : <Phone />}
                sx={{ py: 1.5, mb: 2 }}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </Box>
          )}

          {step === 2 && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Enter the 6-digit code sent to {phoneNumber}
              </Typography>

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
            </Box>
          )}

          {/* Diagnostic Information */}
          <Accordion sx={{ mt: 3 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="body2">
                Debug Information ({diagnosticInfo.length} events)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {diagnosticInfo.map((info, index) => (
                  <Typography key={index} variant="caption" display="block" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                    {info}
                  </Typography>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
    </Paper>
  );
};

export default DiagnosticFirebaseOTP;
