/**
 * Login Page - Uses site logo and optional banner from Settings
 * With swap animation to Signup page
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Link,
  InputAdornment,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { authAPI, siteSettingsAPI } from '../services/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [siteSettings, setSiteSettings] = useState({ site_name: 'WeHealth', logo_url: null, banner_url: null });
  const [isExiting, setIsExiting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetUsername, setResetUsername] = useState('');
  const [resetUserEmail, setResetUserEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    siteSettingsAPI.getPublic()
      .then((res) => setSiteSettings(res.data))
      .catch(() => {});
  }, []);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!username || !password) {
      toast.error('Please enter both username and password');
      setLoading(false);
      return;
    }

    const result = await login(username, password);
    
    if (result.success) {
      toast.success('Login successful!');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Login failed. Please check your credentials.');
    }
    
    setLoading(false);
  };

  const handleSwapToSignup = () => {
    setIsExiting(true);
    setTimeout(() => {
      navigate('/signup');
    }, 400);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: siteSettings.banner_url
          ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${siteSettings.banner_url}) center/cover`
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        position: 'relative',
        overflow: 'hidden',
        animation: isExiting ? 'slideOutLeft 0.4s ease-in-out forwards' : 'slideInRight 0.4s ease-in-out',
        '@keyframes slideInRight': {
          '0%': {
            transform: 'translateX(100%)',
            opacity: 0,
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: 1,
          },
        },
        '@keyframes slideOutLeft': {
          '0%': {
            transform: 'translateX(0)',
            opacity: 1,
          },
          '100%': {
            transform: 'translateX(-100%)',
            opacity: 0,
          },
        },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} sx={{ minHeight: '90vh' }}>
          {/* Left Side - Login Form */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%' }}>
              {/* Logo - large, from site settings */}
              <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                {siteSettings.logo_url ? (
                  <Box component="img" src={siteSettings.logo_url} alt="Logo" sx={{ width: 88, height: 88, objectFit: 'contain' }} />
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.5, width: 88, height: 88 }}>
                    <Box sx={{ bgcolor: '#0ea5a4', borderRadius: 1 }} />
                    <Box sx={{ bgcolor: '#ff6b35', borderRadius: 1 }} />
                    <Box sx={{ bgcolor: '#ff6b35', borderRadius: 1 }} />
                    <Box sx={{ bgcolor: '#0ea5a4', borderRadius: 1 }} />
                  </Box>
                )}
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                  {siteSettings.site_name || 'WeHealth'}
                </Typography>
              </Box>

              {/* Login Card */}
              <Paper
                elevation={10}
                sx={{
                  p: 4,
                  background: 'linear-gradient(180deg, #4a90e2 0%, #357abd 100%)',
                  borderRadius: 3,
                  animation: isExiting ? 'cardExit 0.3s ease-in-out forwards' : 'cardEnter 0.5s ease-in-out',
                  '@keyframes cardEnter': {
                    '0%': {
                      transform: 'scale(0.95) translateY(20px)',
                      opacity: 0,
                    },
                    '100%': {
                      transform: 'scale(1) translateY(0)',
                      opacity: 1,
                    },
                  },
                  '@keyframes cardExit': {
                    '0%': {
                      transform: 'scale(1) translateY(0)',
                      opacity: 1,
                    },
                    '100%': {
                      transform: 'scale(0.95) translateY(-20px)',
                      opacity: 0,
                    },
                  },
                }}
              >
                <Typography variant="h4" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
                  Sign In
                </Typography>

                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="Username"
                    variant="filled"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    sx={{
                      mb: 2,
                      '& .MuiFilledInput-root': {
                        bgcolor: 'white',
                        borderRadius: 2,
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    variant="filled"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    sx={{
                      mb: 2,
                      '& .MuiFilledInput-root': {
                        bgcolor: 'white',
                        borderRadius: 2,
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          sx={{ color: 'white' }}
                        />
                      }
                      label={<Typography variant="body2" sx={{ color: 'white' }}>Remember me</Typography>}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Link
                      component="button"
                      onClick={() => { setForgotOpen(true); setResetStep(1); }}
                      sx={{ color: 'white', textDecoration: 'underline' }}
                    >
                      Forgot password?
                    </Link>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      mb: 2,
                      bgcolor: 'white',
                      color: '#357abd',
                      fontWeight: 'bold',
                      '&:hover': {
                        bgcolor: '#f0f0f0',
                      },
                    }}
                  >
                    {loading ? 'Logging in...' : 'Log In'}
                  </Button>

                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
                      Don't have an account?
                    </Typography>
                    <Link
                      component="button"
                      onClick={handleSwapToSignup}
                      sx={{
                        color: 'white',
                        textDecoration: 'underline',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        '&:hover': {
                          color: '#f0f0f0',
                          transform: 'scale(1.05)',
                          transition: 'transform 0.2s',
                        },
                      }}
                    >
                      Sign Up Here
                    </Link>
                  </Box>
                </form>
              </Paper>
            </Box>
          </Grid>

          {/* Right Side - Promotional Visual */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: '100%',
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                animation: isExiting ? 'rightExit 0.3s ease-in-out forwards' : 'rightEnter 0.5s ease-in-out 0.1s forwards',
                opacity: 0,
                '@keyframes rightEnter': {
                  '0%': {
                    transform: 'translateX(50px)',
                    opacity: 0,
                  },
                  '100%': {
                    transform: 'translateX(0)',
                    opacity: 1,
                  },
                },
                '@keyframes rightExit': {
                  '0%': {
                    transform: 'translateX(0)',
                    opacity: 1,
                  },
                  '100%': {
                    transform: 'translateX(-50px)',
                    opacity: 0,
                  },
                },
              }}
            >
              {/* Decorative shapes */}
              <Box
                sx={{
                  position: 'absolute',
                  width: 300,
                  height: 300,
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  top: -100,
                  right: -100,
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  width: 200,
                  height: 200,
                  bgcolor: 'rgba(255, 107, 53, 0.2)',
                  borderRadius: '50%',
                  bottom: -50,
                  left: -50,
                }}
              />

              {/* Content */}
              <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <Typography
                  variant="h3"
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                    mb: 2,
                  }}
                >
                  Welcome to WeHealth
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    mb: 4,
                  }}
                >
                  Your trusted healthcare management system
                </Typography>

                {/* Stats Cards */}
                <Grid container spacing={2} sx={{ mt: 4 }}>
                  <Grid item xs={6}>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="h6" sx={{ color: '#357abd', fontWeight: 'bold' }}>
                        50k+ Customers
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Connect with a Doctor
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {resetStep === 1 && (
            <>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                Enter your username and email. If both match, we will send a 6-digit OTP for forgot password.
                Type that OTP here and do not share it with anyone.
              </Typography>
              <TextField
                fullWidth
                margin="dense"
                label="Your Username"
                value={resetUsername}
                onChange={(e) => setResetUsername(e.target.value)}
              />
              <TextField
                fullWidth
                margin="dense"
                label="Your Email"
                value={resetUserEmail}
                onChange={(e) => setResetUserEmail(e.target.value)}
              />
            </>
          )}
          {resetStep === 2 && (
            <TextField
              fullWidth
              margin="dense"
              label="6 Digit OTP"
              value={resetOtp}
              onChange={(e) => setResetOtp(e.target.value)}
            />
          )}
          {resetStep === 3 && (
            <TextField
              fullWidth
              margin="dense"
              type="password"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForgotOpen(false)}>Close</Button>
          {resetStep === 1 && (
            <Button
              variant="contained"
              onClick={async () => {
                try {
                  await authAPI.requestPasswordResetOTP({ username: resetUsername, email: resetUserEmail });
                  toast.success('OTP sent to email');
                  setResetStep(2);
                } catch {
                  toast.error('Username and email do not match or OTP send failed');
                }
              }}
            >
              Send OTP
            </Button>
          )}
          {resetStep === 2 && (
            <Button
              variant="contained"
              onClick={async () => {
                try {
                  await authAPI.verifyPasswordResetOTP({ username: resetUsername, email: resetUserEmail, otp: resetOtp });
                  toast.success('OTP verified');
                  setResetStep(3);
                } catch {
                  toast.error('Invalid OTP');
                }
              }}
            >
              Verify OTP
            </Button>
          )}
          {resetStep === 3 && (
            <Button
              variant="contained"
              onClick={async () => {
                try {
                  await authAPI.resetPassword({
                    username: resetUsername,
                    email: resetUserEmail,
                    otp: resetOtp,
                    new_password: newPassword,
                  });
                  toast.success('Password updated');
                  setForgotOpen(false);
                  setResetStep(1);
                  setResetUsername('');
                  setResetUserEmail('');
                  setResetOtp('');
                  setNewPassword('');
                } catch (e) {
                  toast.error(e?.response?.data?.new_password?.[0] || 'Failed to reset password');
                }
              }}
            >
              Change Password
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}