import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Link
} from '@mui/material';
import { Email } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
      await axios.post(`${API_BASE_URL}/api/auth/password-reset/`, { email });
      
      setSuccess(true);
    } catch (error) {
      console.error('Password reset request error:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        // Show success message even on error for security reasons
        // (don't reveal if email exists in system)
        setSuccess(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ bgcolor: '#f5f5f5' }}
      >
        <Paper elevation={3} sx={{ p: 4, maxWidth: 500, width: '100%' }}>
          <Typography variant="h5" gutterBottom align="center" color="primary">
            Check Your Email
          </Typography>
          <Alert severity="success" sx={{ mt: 2, mb: 3 }}>
            If an account exists with the email <strong>{email}</strong>, you will receive 
            password reset instructions shortly.
          </Alert>
          <Typography variant="body2" color="textSecondary" align="center" paragraph>
            Please check your inbox and spam folder. The reset link will expire in 1 hour.
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate('/login')}
            sx={{ mt: 2 }}
          >
            Back to Login
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ bgcolor: '#f5f5f5' }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" gutterBottom align="center">
          Reset Password
        </Typography>
        <Typography variant="body2" color="textSecondary" align="center" paragraph>
          Enter your email address and we'll send you a link to reset your password.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            disabled={loading}
            autoFocus
            InputProps={{
              startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => navigate('/login')}
              disabled={loading}
              sx={{ cursor: 'pointer' }}
            >
              Back to Login
            </Link>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default ForgotPasswordPage;
