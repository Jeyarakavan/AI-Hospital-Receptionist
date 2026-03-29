/**
 * Signup/Registration Page - Enhanced UI
 * Matches Login page dark glassmorphism aesthetic
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  Grid,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { authAPI, siteSettingsAPI } from '../services/api';
import { toast } from 'react-toastify';

/* ─── Floating particles (same as Login) ─── */
const Particles = () => (
  <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    {[...Array(16)].map((_, i) => (
      <Box key={i} sx={{
        position: 'absolute',
        width: `${6 + (i % 5) * 5}px`,
        height: `${6 + (i % 5) * 5}px`,
        borderRadius: '50%',
        background: i % 3 === 0
          ? 'rgba(99,179,237,0.15)'
          : i % 3 === 1
          ? 'rgba(154,230,180,0.12)'
          : 'rgba(255,255,255,0.06)',
        top: `${(i * 41 + 7) % 95}%`,
        left: `${(i * 59 + 5) % 95}%`,
        animation: `floatDot ${6 + (i % 4) * 2}s ease-in-out infinite alternate`,
        animationDelay: `${i * 0.35}s`,
        '@keyframes floatDot': {
          '0%': { transform: 'translateY(0px) scale(1)', opacity: 0.5 },
          '100%': { transform: `translateY(${-16 - (i % 3) * 10}px) scale(1.12)`, opacity: 0.9 },
        },
      }} />
    ))}
  </Box>
);

/* ─── Health Cross fallback logo ─── */
const HealthCross = () => (
  <Box sx={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
    <Box sx={{ position: 'absolute', top: '33%', left: 0, right: 0, height: '34%', background: 'linear-gradient(90deg,#38bdf8,#818cf8)', borderRadius: 4 }} />
    <Box sx={{ position: 'absolute', left: '33%', top: 0, bottom: 0, width: '34%', background: 'linear-gradient(180deg,#38bdf8,#818cf8)', borderRadius: 4 }} />
  </Box>
);

/* ─── Shared glass field style ─── */
const glassField = {
  '& .MuiInputBase-root': {
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    color: '#f1f5f9',
    transition: 'border 0.25s, box-shadow 0.25s',
    '&:hover': { border: '1px solid rgba(99,179,237,0.45)' },
    '&.Mui-focused': { border: '1px solid #63b3ed', boxShadow: '0 0 0 3px rgba(99,179,237,0.13)' },
  },
  '& .MuiInputBase-input': { color: '#f1f5f9', padding: '13px 14px' },
  '& .MuiInputBase-inputMultiline': { padding: '4px 0' },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.42)', fontSize: '0.855rem' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#63b3ed' },
  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
  '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.4)' },
};

/* ─── Section header inside form ─── */
const SectionLabel = ({ icon, label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, mt: 1 }}>
    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#63b3ed', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      {icon} {label}
    </Typography>
    <Box sx={{ flex: 1, height: '1px', background: 'rgba(99,179,237,0.18)' }} />
  </Box>
);

/* ─── File upload button ─── */
const FileUploadBtn = ({ label, file, onChange, accept = 'image/*' }) => (
  <Box>
    <Button
      variant="outlined"
      component="label"
      fullWidth
      sx={{
        borderRadius: '12px',
        border: '1px dashed rgba(99,179,237,0.4)',
        color: 'rgba(255,255,255,0.55)',
        textTransform: 'none',
        fontSize: '0.82rem',
        fontWeight: 500,
        py: 1.3,
        background: 'rgba(99,179,237,0.04)',
        transition: 'all 0.22s',
        '&:hover': {
          border: '1px dashed #63b3ed',
          background: 'rgba(99,179,237,0.09)',
          color: '#63b3ed',
        },
      }}
    >
      <Box sx={{ mr: 1, fontSize: '1rem' }}>📎</Box> {label}
      <input type="file" hidden accept={accept} onChange={onChange} />
    </Button>
    {file && (
      <Box sx={{
        mt: 0.8, px: 1.5, py: 0.6, borderRadius: '8px',
        background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)',
        display: 'flex', alignItems: 'center', gap: 0.8,
      }}>
        <Box sx={{ color: '#34d399', fontSize: '0.75rem' }}>✓</Box>
        <Typography sx={{ fontSize: '0.75rem', color: '#34d399', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file.name}
        </Typography>
      </Box>
    )}
  </Box>
);

export default function Signup() {
  const [siteSettings, setSiteSettings] = useState({ site_name: 'WeHealth', logo_url: null, banner_url: null });
  const [isExiting, setIsExiting] = useState(false);
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirm_password: '',
    full_name: '', date_of_birth: '', phone_number: '', address: '',
    about_yourself: '', role: '', specialization: '',
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [idCard, setIdCard] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    siteSettingsAPI.getPublic().then((res) => setSiteSettings(res.data)).catch(() => {});
  }, []);

  const validateImageFile = (file) => {
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) throw new Error('Image file size must be less than 10MB');
    const fileExt = file.name.toLowerCase().split('.').pop();
    if (!allowedExtensions.includes(fileExt))
      throw new Error(`Allowed formats: ${allowedExtensions.join(', ')}`);
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      validateImageFile(file);
      type === 'profile' ? setProfilePicture(file) : setIdCard(file);
    } catch (error) {
      toast.error(error.message);
      e.target.value = '';
    }
  };

  const handleSwapToLogin = () => {
    setIsExiting(true);
    setTimeout(() => navigate('/login'), 420);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const checks = [
      [!formData.full_name?.trim(), 'Full Name is required'],
      [!formData.date_of_birth, 'Date of Birth is required'],
      [!formData.email?.trim(), 'Email is required'],
      [!formData.phone_number?.trim(), 'Phone Number is required'],
      [!formData.address?.trim(), 'Address is required'],
      [!formData.username?.trim(), 'Username is required'],
      [!formData.role, 'Please select a role'],
      [formData.role === 'Doctor' && !formData.specialization?.trim(), 'Specialization is required for Doctors'],
      [!formData.password || !formData.confirm_password, 'Password and Confirm Password are required'],
      [formData.password !== formData.confirm_password, 'Passwords do not match'],
      [formData.password.length < 6, 'Password must be at least 6 characters'],
    ];

    for (const [condition, msg] of checks) {
      if (condition) { toast.error(msg); setLoading(false); return; }
    }

    const data = new FormData();
    ['username','email','password','confirm_password','full_name','date_of_birth',
     'phone_number','address','role'].forEach(k => data.append(k, formData[k]));
    if (formData.about_yourself) data.append('about_yourself', formData.about_yourself);
    if (profilePicture) data.append('profile_picture', profilePicture);
    if (formData.role === 'Doctor') {
      data.append('specialization', formData.specialization || '');
      if (idCard) data.append('doctor_id_card', idCard);
    } else if (formData.role === 'Staff' && idCard) {
      data.append('staff_id_card', idCard);
    } else if (formData.role === 'Receptionist' && idCard) {
      data.append('receptionist_id_card', idCard);
    }

    try {
      await authAPI.register(data);
      toast.success('Registration successful! Waiting for admin approval.');
      handleSwapToLogin();
    } catch (error) {
      let errorMsg = 'Registration failed. Please try again.';
      if (error.response) {
        const { status, data: rd } = error.response;
        if (status === 503) errorMsg = 'Database not initialized. Please contact administrator.';
        else if (status === 400) {
          for (const key of ['username','email','password','phone_number','full_name','date_of_birth','address','non_field_errors','error']) {
            if (rd?.[key]) { errorMsg = `${key !== 'non_field_errors' && key !== 'error' ? key + ': ' : ''}${Array.isArray(rd[key]) ? rd[key][0] : rd[key]}`; break; }
          }
          if (errorMsg === 'Registration failed. Please try again.' && typeof rd === 'object')
            errorMsg = Object.entries(rd).map(([k,v]) => `${k}: ${Array.isArray(v)?v[0]:v}`).join(', ');
        } else if (rd?.error) errorMsg = rd.error;
        else if (rd?.message) errorMsg = rd.message;
      } else if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
        errorMsg = 'Cannot connect to server. Please check if backend is running.';
      } else if (error.message) errorMsg = error.message;
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const roleSpecificFields = () => {
    if (formData.role === 'Doctor') return (
      <>
        <Grid item xs={12}>
          <TextField fullWidth label="Specialization" name="specialization"
            value={formData.specialization} onChange={handleChange} required sx={glassField} />
        </Grid>
        <Grid item xs={12}>
          <FileUploadBtn label="Upload Doctor ID Card" file={idCard}
            onChange={(e) => handleFileChange(e, 'idCard')} />
        </Grid>
      </>
    );
    if (formData.role === 'Staff') return (
      <Grid item xs={12}>
        <FileUploadBtn label="Upload Staff ID Card" file={idCard}
          onChange={(e) => handleFileChange(e, 'idCard')} />
      </Grid>
    );
    if (formData.role === 'Receptionist') return (
      <Grid item xs={12}>
        <FileUploadBtn label="Upload Receptionist ID Card" file={idCard}
          onChange={(e) => handleFileChange(e, 'idCard')} />
      </Grid>
    );
    return null;
  };

  const bgStyle = siteSettings.banner_url
    ? { backgroundImage: `linear-gradient(135deg,rgba(10,15,30,0.84) 0%,rgba(10,20,40,0.78) 100%), url(${siteSettings.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1f3c 40%, #0f2a4a 70%, #071422 100%)' };

  return (
    <Box sx={{
      minHeight: '100vh',
      ...bgStyle,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: { xs: 2, md: '40px 24px' },
      position: 'relative', overflow: 'hidden',
      fontFamily: "'Sora', 'Nunito', sans-serif",
      animation: isExiting ? 'pageOut 0.42s ease forwards' : 'pageIn 0.45s ease',
      '@keyframes pageIn': { from: { opacity: 0, transform: 'translateY(18px)' }, to: { opacity: 1, transform: 'none' } },
      '@keyframes pageOut': { from: { opacity: 1, transform: 'none' }, to: { opacity: 0, transform: 'translateY(-18px)' } },
    }}>
      {/* Ambient orbs */}
      <Box sx={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)', top: '-20%', right: '-10%', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.07) 0%, transparent 70%)', bottom: '-12%', left: '-8%', pointerEvents: 'none' }} />
      <Particles />

      {/* ── Main card ── */}
      <Box sx={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 860,
        background: 'rgba(255,255,255,0.032)',
        backdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '28px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
        overflow: 'hidden',
        animation: 'cardRise 0.55s cubic-bezier(.22,1,.36,1)',
        '@keyframes cardRise': { from: { opacity: 0, transform: 'translateY(32px) scale(0.97)' }, to: { opacity: 1, transform: 'none' } },
      }}>

        {/* ── Top banner strip ── */}
        <Box sx={{
          px: { xs: 3, md: 5 }, py: 3,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'linear-gradient(90deg, rgba(56,189,248,0.07) 0%, rgba(129,140,248,0.07) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {siteSettings.logo_url
              ? <Box component="img" src={siteSettings.logo_url} alt="Logo" sx={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 2 }} />
              : <HealthCross />}
            <Box>
              <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, background: 'linear-gradient(90deg,#e2e8f0,#94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {siteSettings.site_name || 'WeHealth'}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                New Account Registration
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>Already have an account?</Typography>
            <Box
              component="button"
              onClick={handleSwapToLogin}
              sx={{
                background: 'rgba(99,179,237,0.12)', border: '1px solid rgba(99,179,237,0.3)',
                borderRadius: '8px', px: 1.5, py: 0.6, color: '#63b3ed',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s', fontFamily: 'inherit',
                '&:hover': { background: 'rgba(99,179,237,0.22)', transform: 'translateY(-1px)' },
              }}
            >
              Sign In
            </Box>
          </Box>
        </Box>

        {/* ── Form body ── */}
        <Box component="form" onSubmit={handleSubmit} sx={{ px: { xs: 3, md: 5 }, py: 4 }}>
          <Grid container spacing={2}>

            {/* Personal Info */}
            <Grid item xs={12}><SectionLabel icon="👤" label="Personal Information" /></Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Full Name" name="full_name"
                value={formData.full_name} onChange={handleChange} required sx={glassField} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Date of Birth" name="date_of_birth" type="date"
                value={formData.date_of_birth} onChange={handleChange} required
                InputLabelProps={{ shrink: true }} sx={glassField} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Email" name="email" type="email"
                value={formData.email} onChange={handleChange} required sx={glassField} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Phone Number" name="phone_number"
                value={formData.phone_number} onChange={handleChange} required sx={glassField} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address" name="address" multiline rows={2}
                value={formData.address} onChange={handleChange} required sx={glassField} />
            </Grid>

            {/* Profile picture */}
            <Grid item xs={12}>
              <FileUploadBtn label="Upload Profile Picture (optional)" file={profilePicture}
                onChange={(e) => handleFileChange(e, 'profile')} />
            </Grid>

            <Grid item xs={12}>
              <TextField fullWidth label="About Yourself (optional)" name="about_yourself"
                multiline rows={2} value={formData.about_yourself} onChange={handleChange} sx={glassField} />
            </Grid>

            {/* Account Info */}
            <Grid item xs={12}><SectionLabel icon="🔐" label="Account Details" /></Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Username" name="username"
                value={formData.username} onChange={handleChange} required sx={glassField} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Role / Category" name="role"
                value={formData.role} onChange={handleChange} required sx={glassField}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        background: '#0d1f3c', border: '1px solid rgba(99,179,237,0.2)',
                        borderRadius: '12px', mt: 0.5,
                        '& .MuiMenuItem-root': { color: '#f1f5f9', fontSize: '0.875rem', borderRadius: '8px', mx: 0.5,
                          '&:hover': { background: 'rgba(99,179,237,0.12)' },
                          '&.Mui-selected': { background: 'rgba(99,179,237,0.18)' },
                        },
                      },
                    },
                  },
                }}>
                <MenuItem value="Doctor">🩺 Doctor</MenuItem>
                <MenuItem value="Staff">🏥 Staff / Nurse</MenuItem>
                <MenuItem value="Receptionist">📋 Receptionist</MenuItem>
                <MenuItem value="Admin">⚙️ Admin</MenuItem>
              </TextField>
            </Grid>

            {/* Role-specific fields */}
            {roleSpecificFields()}

            {/* Passwords */}
            <Grid item xs={12}><SectionLabel icon="🔑" label="Security" /></Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Password" name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password} onChange={handleChange} required sx={glassField}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end"
                        sx={{ color: 'rgba(255,255,255,0.35)', '&:hover': { color: '#63b3ed' } }}>
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Confirm Password" name="confirm_password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirm_password} onChange={handleChange} required sx={glassField}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end"
                        sx={{ color: 'rgba(255,255,255,0.35)', '&:hover': { color: '#63b3ed' } }}>
                        {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Password strength hint */}
            {formData.password && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
                  {[1,2,3,4].map(lvl => (
                    <Box key={lvl} sx={{
                      height: 3, flex: 1, borderRadius: 2,
                      background: formData.password.length >= lvl * 3
                        ? lvl <= 1 ? '#f87171' : lvl <= 2 ? '#fb923c' : lvl <= 3 ? '#facc15' : '#34d399'
                        : 'rgba(255,255,255,0.1)',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                  <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', ml: 1, whiteSpace: 'nowrap' }}>
                    {formData.password.length < 4 ? 'Weak' : formData.password.length < 7 ? 'Fair' : formData.password.length < 10 ? 'Good' : 'Strong'}
                  </Typography>
                </Box>
              </Grid>
            )}

            {/* Submit */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Button type="submit" fullWidth disabled={loading}
                sx={{
                  py: 1.65, borderRadius: '14px', fontWeight: 700, fontSize: '0.95rem',
                  letterSpacing: '0.3px', textTransform: 'none',
                  background: loading
                    ? 'rgba(99,179,237,0.25)'
                    : 'linear-gradient(135deg,#38bdf8 0%,#818cf8 100%)',
                  color: '#fff',
                  boxShadow: '0 4px 20px rgba(56,189,248,0.28)',
                  transition: 'all 0.25s ease',
                  '&:hover:not(:disabled)': { transform: 'translateY(-2px)', boxShadow: '0 8px 28px rgba(56,189,248,0.42)' },
                  '&:active:not(:disabled)': { transform: 'translateY(0px)' },
                }}
              >
                {loading
                  ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.75s linear infinite', '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }} />
                      Creating account...
                    </Box>
                  : 'Create Account'
                }
              </Button>
            </Grid>

            {/* Notice */}
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', mt: 0.5, px: 2, py: 1.5, borderRadius: '10px', background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.15)' }}>
                <Typography sx={{ fontSize: '0.78rem', color: 'rgba(251,191,36,0.75)' }}>
                  ⏳ Your account will require admin approval before you can sign in.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}