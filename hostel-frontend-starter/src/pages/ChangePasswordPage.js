import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Alert,
  CircularProgress, InputAdornment, IconButton, LinearProgress,
} from '@mui/material';
import { Lock, Visibility, VisibilityOff, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-4
}

const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['', 'error', 'warning', 'info', 'success'];

export default function ChangePasswordPage({ forced = false }) {
  const navigate   = useNavigate();
  const { token, refreshUserData } = useUser();

  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  const strength = passwordStrength(next);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!current) { setError('Please enter your current password'); return; }
    if (next.length < 8) { setError('New password must be at least 8 characters'); return; }
    if (next !== confirm) { setError('Passwords do not match'); return; }
    if (forced && next === current) {
      setError('New password must be different from the default password'); return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API_BASE}/api/auth/change-password/`,
        { current_password: current, new_password: next },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(true);
      // Refresh user profile so must_change_password flag is cleared
      if (refreshUserData) await refreshUserData();
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{ bgcolor: '#f5f5f5' }}>
        <Paper elevation={3} sx={{ p: 4, maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="primary" fontWeight={700}>
            Password Changed!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Redirecting to your dashboard…
          </Typography>
          <LinearProgress sx={{ mt: 3, borderRadius: 2 }} />
        </Paper>
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{ bgcolor: '#f5f5f5' }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 440, width: '100%' }}>

        {forced && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            You are using a temporary default password. Please set a new password to continue.
          </Alert>
        )}

        <Typography variant="h5" gutterBottom align="center" fontWeight={700}>
          {forced ? 'Set Your Password' : 'Change Password'}
        </Typography>
        <Typography variant="body2" color="textSecondary" align="center" paragraph>
          {forced
            ? 'Choose a strong password you will remember.'
            : 'Enter your current password and a new one.'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth margin="normal" label="Current Password"
            type={showPw ? 'text' : 'password'}
            value={current} onChange={(e) => setCurrent(e.target.value)}
            disabled={loading}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPw(s => !s)} edge="end">
                    {showPw ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth margin="normal" label="New Password"
            type={showPw ? 'text' : 'password'}
            value={next} onChange={(e) => setNext(e.target.value)}
            disabled={loading}
            helperText={next ? `Strength: ${strengthLabel[strength]}` : 'Minimum 8 characters'}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
            }}
          />
          {next && (
            <LinearProgress
              variant="determinate"
              value={(strength / 4) * 100}
              color={strengthColor[strength]}
              sx={{ height: 6, borderRadius: 3, mb: 1 }}
            />
          )}
          <TextField
            fullWidth margin="normal" label="Confirm New Password"
            type={showPw ? 'text' : 'password'}
            value={confirm} onChange={(e) => setConfirm(e.target.value)}
            disabled={loading}
            error={!!confirm && confirm !== next}
            helperText={confirm && confirm !== next ? 'Passwords do not match' : ''}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
            }}
          />

          <Button
            fullWidth type="submit" variant="contained" size="large"
            disabled={loading} sx={{ mt: 3, mb: 1 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Change Password'}
          </Button>

          {!forced && (
            <Button fullWidth variant="text" onClick={() => navigate(-1)} disabled={loading}>
              Cancel
            </Button>
          )}
        </form>
      </Paper>
    </Box>
  );
}
