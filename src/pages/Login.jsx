/**
 * Login Page - Enhanced UI
 * Uses site logo and optional banner from Settings
 * With swap animation to Signup page
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Link,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { authAPI, siteSettingsAPI } from '../services/api';

/* ─── Floating particle dots for background atmosphere ─── */
const Particles = () => (
  <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    {[...Array(18)].map((_, i) => (
      <Box
        key={i}
        sx={{
          position: 'absolute',
          width: `${6 + (i % 5) * 6}px`,
          height: `${6 + (i % 5) * 6}px`,
          borderRadius: '50%',
          background: i % 3 === 0
            ? 'rgba(99,179,237,0.18)'
            : i % 3 === 1
            ? 'rgba(154,230,180,0.15)'
            : 'rgba(255,255,255,0.08)',
          top: `${(i * 37 + 5) % 95}%`,
          left: `${(i * 53 + 10) % 95}%`,
          animation: `floatDot ${6 + (i % 4) * 2}s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.4}s`,
          '@keyframes floatDot': {
            '0%': { transform: 'translateY(0px) scale(1)', opacity: 0.6 },
            '100%': { transform: `translateY(${-18 - (i % 3) * 12}px) scale(1.15)`, opacity: 1 },
          },
        }}
      />
    ))}
  </Box>
);

/* ─── Animated health cross icon (fallback logo) ─── */
const HealthCross = () => (
  <Box sx={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
    <Box sx={{
      position: 'absolute', top: '33%', left: 0, right: 0, height: '34%',
      background: 'linear-gradient(90deg,#38bdf8,#818cf8)', borderRadius: 6,
    }} />
    <Box sx={{
      position: 'absolute', left: '33%', top: 0, bottom: 0, width: '34%',
      background: 'linear-gradient(180deg,#38bdf8,#818cf8)', borderRadius: 6,
    }} />
  </Box>
);

/* ─── Glassmorphism field style helper ─── */
const glassField = {
  '& .MuiInputBase-root': {
    background: 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '14px',
    color: '#f1f5f9',
    transition: 'border 0.25s, box-shadow 0.25s',
    '&:hover': { border: '1px solid rgba(99,179,237,0.5)' },
    '&.Mui-focused': {
      border: '1px solid #63b3ed',
      boxShadow: '0 0 0 3px rgba(99,179,237,0.15)',
    },
  },
  '& .MuiInputBase-input': { color: '#f1f5f9', padding: '14px 16px' },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#63b3ed' },
  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
  '& .MuiFilledInput-root::before, & .MuiFilledInput-root::after': { display: 'none' },
};

/* ─── Step indicator dots ─── */
const StepDots = ({ current, total }) => (
  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
    {[...Array(total)].map((_, i) => (
      <Box key={i} sx={{
        width: i === current - 1 ? 24 : 8, height: 8, borderRadius: 4,
        background: i === current - 1 ? '#63b3ed' : 'rgba(255,255,255,0.2)',
        transition: 'all 0.35s cubic-bezier(.4,0,.2,1)',
      }} />
    ))}
  </Box>
);

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
    setTimeout(() => navigate('/signup'), 420);
  };

  /* ─── background: banner or deep dark-teal mesh ─── */
  const bgStyle = siteSettings.banner_url
    ? {
        backgroundImage: `linear-gradient(135deg,rgba(10,15,30,0.82) 0%,rgba(10,20,40,0.75) 100%), url(${siteSettings.banner_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1f3c 40%, #0f2a4a 70%, #071422 100%)',
      };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        ...bgStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: { xs: 2, md: 4 },
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Sora', 'Nunito', sans-serif",
        animation: isExiting ? 'pageOut 0.42s ease forwards' : 'pageIn 0.45s ease',
        '@keyframes pageIn': { from: { opacity: 0, transform: 'translateY(18px)' }, to: { opacity: 1, transform: 'none' } },
        '@keyframes pageOut': { from: { opacity: 1, transform: 'none' }, to: { opacity: 0, transform: 'translateY(-18px)' } },
      }}
    >
      {/* Ambient glow orbs */}
      <Box sx={{
        position: 'absolute', width: 520, height: 520, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56,189,248,0.09) 0%, transparent 70%)',
        top: '-15%', left: '-10%', pointerEvents: 'none',
      }} />
      <Box sx={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(129,140,248,0.08) 0%, transparent 70%)',
        bottom: '-10%', right: '-8%', pointerEvents: 'none',
      }} />
      <Particles />

      {/* ── Centered two-column card ── */}
      <Box
        sx={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: { xs: 'column', md: 'row' },
          width: '100%', maxWidth: 1020,
          background: 'rgba(255,255,255,0.035)',
          backdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '28px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
          overflow: 'hidden',
          animation: 'cardRise 0.55s cubic-bezier(.22,1,.36,1)',
          '@keyframes cardRise': {
            from: { opacity: 0, transform: 'translateY(32px) scale(0.97)' },
            to: { opacity: 1, transform: 'none' },
          },
        }}
      >

        {/* ═══════════════ LEFT – Form ═══════════════ */}
        <Box sx={{
          flex: '0 0 auto', width: { xs: '100%', md: '44%' },
          p: { xs: 4, md: '48px 44px' },
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          borderRight: { md: '1px solid rgba(255,255,255,0.06)' },
        }}>

          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 5 }}>
            {siteSettings.logo_url
              ? <Box component="img" src={siteSettings.logo_url} alt="Logo"
                  sx={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 2 }} />
              : <HealthCross />
            }
            <Typography sx={{
              fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.3px',
              background: 'linear-gradient(90deg,#e2e8f0,#94a3b8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {siteSettings.site_name || 'WeHealth'}
            </Typography>
          </Box>

          {/* Headline */}
          <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.15, mb: 0.5 }}>
            Welcome back
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.38)', mb: 4 }}>
            Sign in to your healthcare dashboard
          </Typography>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth variant="outlined"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              sx={glassField}
            />

            <TextField
              fullWidth variant="outlined"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={glassField}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end"
                      sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#63b3ed' } }}>
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Remember + Forgot */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: -0.5 }}>
              <FormControlLabel
                control={
                  <Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                    size="small"
                    sx={{ color: 'rgba(255,255,255,0.3)', '&.Mui-checked': { color: '#63b3ed' }, p: 0.5 }} />
                }
                label={<Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>Remember me</Typography>}
              />
              <Link component="button" type="button"
                onClick={() => { setForgotOpen(true); setResetStep(1); }}
                sx={{ fontSize: '0.8rem', color: '#63b3ed', textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' } }}>
                Forgot password?
              </Link>
            </Box>

            {/* Submit */}
            <Button type="submit" fullWidth disabled={loading}
              sx={{
                mt: 1, py: 1.6, borderRadius: '14px', fontWeight: 700, fontSize: '0.95rem',
                letterSpacing: '0.3px', textTransform: 'none',
                background: loading
                  ? 'rgba(99,179,237,0.3)'
                  : 'linear-gradient(135deg,#38bdf8 0%,#818cf8 100%)',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(56,189,248,0.3)',
                transition: 'all 0.25s ease',
                '&:hover:not(:disabled)': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 28px rgba(56,189,248,0.45)',
                },
                '&:active:not(:disabled)': { transform: 'translateY(0px)' },
              }}
            >
              {loading
                ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                      width: 16, height: 16, borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      animation: 'spin 0.75s linear infinite',
                      '@keyframes spin': { to: { transform: 'rotate(360deg)' } },
                    }} />
                    Signing in...
                  </Box>
                : 'Sign In'
              }
            </Button>

            {/* Sign up link */}
            <Typography sx={{ textAlign: 'center', fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)', mt: 0.5 }}>
              Don't have an account?{' '}
              <Link component="button" type="button" onClick={handleSwapToSignup}
                sx={{
                  color: '#63b3ed', fontWeight: 600, textDecoration: 'none',
                  transition: 'opacity 0.2s',
                  '&:hover': { opacity: 0.8, textDecoration: 'underline' },
                }}>
                Create account
              </Link>
            </Typography>
          </Box>
        </Box>

        {/* ═══════════════ RIGHT – Visual ═══════════════ */}
        <Box sx={{
          flex: 1, display: { xs: 'none', md: 'flex' }, flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', position: 'relative',
          p: 5, overflow: 'hidden',
          background: 'linear-gradient(145deg,rgba(56,189,248,0.06) 0%,rgba(129,140,248,0.06) 100%)',
        }}>

          {/* Background mesh rings */}
          {[340, 240, 140].map((size, i) => (
            <Box key={i} sx={{
              position: 'absolute',
              width: size, height: size, borderRadius: '50%',
              border: `1px solid rgba(99,179,237,${0.07 + i * 0.04})`,
              top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              animation: `pulse ${4 + i}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.6}s`,
              '@keyframes pulse': {
                from: { transform: 'translate(-50%,-50%) scale(1)', opacity: 0.6 },
                to: { transform: 'translate(-50%,-50%) scale(1.06)', opacity: 1 },
              },
            }} />
          ))}

          {/* Central icon */}
          <Box sx={{
            width: 80, height: 80, borderRadius: '22px', mb: 4,
            background: 'linear-gradient(135deg,#38bdf8,#818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 16px 40px rgba(56,189,248,0.35)',
            animation: 'iconFloat 3s ease-in-out infinite alternate',
            '@keyframes iconFloat': {
              from: { transform: 'translateY(0px)' },
              to: { transform: 'translateY(-10px)' },
            },
          }}>
            {/* Heart pulse icon */}
            <Box component="svg" viewBox="0 0 40 40" sx={{ width: 44, height: 44 }}>
              <path d="M20 34 C20 34 6 24 6 14.5 A7.5 7.5 0 0 1 20 10 A7.5 7.5 0 0 1 34 14.5 C34 24 20 34 20 34Z"
                fill="rgba(255,255,255,0.9)" />
            </Box>
          </Box>

          <Typography sx={{
            fontSize: '1.7rem', fontWeight: 800, textAlign: 'center', lineHeight: 1.2, mb: 1.5,
            background: 'linear-gradient(135deg,#e2e8f0 30%,#94a3b8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Your health, our priority
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.35)', textAlign: 'center', fontSize: '0.875rem', mb: 5, maxWidth: 280 }}>
            Manage appointments, records, and connect with healthcare professionals — all in one place.
          </Typography>

          {/* Stat pills */}
          {[
            { label: 'Patients Served', value: '50k+', color: '#38bdf8' },
            { label: 'Doctors Available', value: '200+', color: '#818cf8' },
            { label: 'Uptime', value: '99.9%', color: '#34d399' },
          ].map((stat, i) => (
            <Box key={i} sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', maxWidth: 300,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px', px: 2.5, py: 1.5, mb: 1.5,
              animation: `slideUp 0.5s ease ${0.1 + i * 0.1}s both`,
              '@keyframes slideUp': {
                from: { opacity: 0, transform: 'translateY(16px)' },
                to: { opacity: 1, transform: 'none' },
              },
            }}>
              <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{stat.label}</Typography>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: stat.color }}>{stat.value}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ═══════════════ Forgot Password Dialog ═══════════════ */}
      <Dialog
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        maxWidth="xs" fullWidth
        PaperProps={{
          sx: {
            background: '#0d1f3c',
            border: '1px solid rgba(99,179,237,0.18)',
            borderRadius: '20px',
            color: '#f1f5f9',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 0, pt: 3, px: 3 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#f1f5f9' }}>Reset Password</Typography>
          <StepDots current={resetStep} total={3} />
          <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.38)', mt: -0.5 }}>
            {resetStep === 1 && 'Enter your credentials to receive an OTP'}
            {resetStep === 2 && 'Enter the 6-digit OTP sent to your email'}
            {resetStep === 3 && 'Create your new password'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pt: 2, pb: 1 }}>
          {resetStep === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
              <TextField fullWidth variant="outlined" label="Username"
                value={resetUsername} onChange={(e) => setResetUsername(e.target.value)}
                sx={glassField} />
              <TextField fullWidth variant="outlined" label="Email"
                value={resetUserEmail} onChange={(e) => setResetUserEmail(e.target.value)}
                sx={glassField} />
            </Box>
          )}
          {resetStep === 2 && (
            <TextField fullWidth variant="outlined" label="6-digit OTP"
              value={resetOtp} onChange={(e) => setResetOtp(e.target.value)}
              sx={{ ...glassField, mt: 1 }}
              inputProps={{ maxLength: 6, style: { letterSpacing: 12, fontSize: '1.4rem', textAlign: 'center' } }} />
          )}
          {resetStep === 3 && (
            <TextField fullWidth variant="outlined" type="password" label="New Password"
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              sx={{ ...glassField, mt: 1 }} />
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
          <Button onClick={() => setForgotOpen(false)}
            sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'none', borderRadius: '10px',
              '&:hover': { background: 'rgba(255,255,255,0.05)' } }}>
            Cancel
          </Button>

          {resetStep === 1 && (
            <Button variant="contained"
              onClick={async () => {
                try {
                  await authAPI.requestPasswordResetOTP({ username: resetUsername, email: resetUserEmail });
                  toast.success('OTP sent to email');
                  setResetStep(2);
                } catch {
                  toast.error('Username and email do not match or OTP send failed');
                }
              }}
              sx={{ background: 'linear-gradient(135deg,#38bdf8,#818cf8)', borderRadius: '10px',
                textTransform: 'none', fontWeight: 700, px: 3,
                '&:hover': { opacity: 0.9 } }}>
              Send OTP
            </Button>
          )}
          {resetStep === 2 && (
            <Button variant="contained"
              onClick={async () => {
                try {
                  await authAPI.verifyPasswordResetOTP({ username: resetUsername, email: resetUserEmail, otp: resetOtp });
                  toast.success('OTP verified');
                  setResetStep(3);
                } catch {
                  toast.error('Invalid OTP');
                }
              }}
              sx={{ background: 'linear-gradient(135deg,#38bdf8,#818cf8)', borderRadius: '10px',
                textTransform: 'none', fontWeight: 700, px: 3,
                '&:hover': { opacity: 0.9 } }}>
              Verify OTP
            </Button>
          )}
          {resetStep === 3 && (
            <Button variant="contained"
              onClick={async () => {
                try {
                  await authAPI.resetPassword({
                    username: resetUsername, email: resetUserEmail,
                    otp: resetOtp, new_password: newPassword,
                  });
                  toast.success('Password updated!');
                  setForgotOpen(false);
                  setResetStep(1);
                  setResetUsername(''); setResetUserEmail('');
                  setResetOtp(''); setNewPassword('');
                } catch (e) {
                  toast.error(e?.response?.data?.new_password?.[0] || 'Failed to reset password');
                }
              }}
              sx={{ background: 'linear-gradient(135deg,#38bdf8,#818cf8)', borderRadius: '10px',
                textTransform: 'none', fontWeight: 700, px: 3,
                '&:hover': { opacity: 0.9 } }}>
              Change Password
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}