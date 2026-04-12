import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography, Alert, CircularProgress,
  InputAdornment, IconButton, Link, Stack
} from '@mui/material';
import { Person, Lock, Visibility, VisibilityOff, Home, CheckCircle } from '@mui/icons-material';

const BRAND_FEATURES = [
  'Role-based access control',
  'Real-time room occupancy tracking',
  'Tenant onboarding & management',
  'Payments & rent tracking',
];
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');  // Can be username or email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useUser();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Please enter both email/username and password');
      setLoading(false);
      return;
    }

    try {
      const result = await login(username, password);

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !loading) {
      handleLogin();
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* ── Left brand panel ── */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        px: 6,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
        color: '#fff',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 5 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: 2.5,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Home sx={{ fontSize: 26, color: '#fff' }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} lineHeight={1.1}>Sree Lakshmi</Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>Hostel Management System</Typography>
          </Box>
        </Box>
        <Typography variant="h3" fontWeight={800} lineHeight={1.2} sx={{ mb: 2 }}>
          Manage your<br />hostel smarter.
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.75, mb: 5, maxWidth: 360 }}>
          A complete platform for ladies hostel management — from room tracking to tenant onboarding.
        </Typography>
        <Stack spacing={1.5}>
          {BRAND_FEATURES.map(f => (
            <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CheckCircle sx={{ color: '#22c55e', fontSize: 20 }} />
              <Typography variant="body2" sx={{ opacity: 0.85 }}>{f}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* ── Right form panel ── */}
      <Box sx={{
        width: { xs: '100%', md: 480 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        px: { xs: 3, sm: 6 },
        py: 6,
        backgroundColor: '#ffffff',
      }}>
        {/* Mobile logo */}
        <Box sx={{ display: { md: 'none' }, mb: 4, textAlign: 'center' }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: 3, mx: 'auto', mb: 1,
            background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Home sx={{ fontSize: 28, color: '#fff' }} />
          </Box>
          <Typography variant="h6" fontWeight={700}>Sree Lakshmi Hostel</Typography>
        </Box>

        <Typography variant="h4" fontWeight={800} color="grey.900" gutterBottom>
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Sign in to your account to continue
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2.5}>
          <TextField
            fullWidth
            label="Email or Username"
            placeholder="Enter your email or username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" disabled={loading}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <Box sx={{ textAlign: 'right' }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/forgot-password')}
              disabled={loading}
              sx={{ cursor: 'pointer', textDecoration: 'none', fontWeight: 500 }}
            >
              Forgot password?
            </Link>
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleLogin}
            disabled={loading}
            sx={{
              borderRadius: 2,
              height: 52,
              fontWeight: 700,
              fontSize: 16,
              background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
              boxShadow: '0 4px 14px rgba(30,64,175,0.4)',
              '&:hover': { background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' },
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Sign In'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default LoginPage;
