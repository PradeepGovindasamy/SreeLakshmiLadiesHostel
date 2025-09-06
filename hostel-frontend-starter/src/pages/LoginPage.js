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
  Tabs,
  Tab,
  InputAdornment,
  Paper,
  Divider
} from '@mui/material';
import { Person, Lock, Phone } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import BackendOTPLogin from '../components/BackendOTPLogin';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, phoneOTPLogin } = useUser();
  const navigate = useNavigate();

  // Handle traditional username/password login
  const handleTraditionalLogin = async () => {
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    try {
      const result = await login(username, password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle phone OTP login success
  const handlePhoneOTPSuccess = (authData) => {
    phoneOTPLogin(authData);
    navigate('/dashboard');
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
  };

  // Handle key press for traditional login
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleTraditionalLogin();
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
            Welcome
          </Typography>
          <Typography variant="body1">
            Sree Lakshmi Ladies Hostel
          </Typography>
        </Box>

        {/* Login Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant="fullWidth"
            indicatorColor="primary"
          >
            <Tab label="Username Login" icon={<Person />} />
            <Tab label="Phone OTP" icon={<Phone />} />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {/* Tab 1: Traditional Username/Password Login */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Sign In with Username
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter your credentials to access your account
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleTraditionalLogin}
                disabled={loading || !username || !password}
                startIcon={loading ? <CircularProgress size={20} /> : <Person />}
                sx={{ py: 1.5 }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  or
                </Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                onClick={() => setActiveTab(1)}
                startIcon={<Phone />}
                sx={{ py: 1.5 }}
              >
                Login with Phone OTP
              </Button>
            </Box>
          )}

          {/* Tab 2: Phone OTP - Backend Only (No Firebase Billing Required) */}
          {activeTab === 1 && (
            <Box sx={{ mt: -2, mx: -2, mb: -2 }}>
              <BackendOTPLogin onLoginSuccess={handlePhoneOTPSuccess} />
            </Box>
          )}
        </CardContent>
      </Paper>
    </Box>
  );
};

export default LoginPage;
