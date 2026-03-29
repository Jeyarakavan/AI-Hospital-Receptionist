/**
 * Profile Page - Enhanced UI
 */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import { Edit, Save, Close, CameraAlt } from '@mui/icons-material';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

/* ─── Gradient avatar ─── */
const GRADIENTS = [
  'linear-gradient(135deg,#38bdf8,#818cf8)',
  'linear-gradient(135deg,#34d399,#0d9488)',
  'linear-gradient(135deg,#fbbf24,#f59e0b)',
  'linear-gradient(135deg,#fb7185,#e11d48)',
  'linear-gradient(135deg,#a78bfa,#7c3aed)',
];
const avatarGrad = (name) => GRADIENTS[(name?.charCodeAt(0) || 0) % GRADIENTS.length];

/* ─── Role badge config ─── */
const ROLE_CONFIG = {
  Admin: { emoji: '⚙️', color: '#818cf8', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.3)' },
  Doctor: { emoji: '🩺', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.3)' },
  Receptionist: { emoji: '📋', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)' },
  Staff: { emoji: '🏥', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' },
};

/* ─── Status badge ─── */
const STATUS_CONFIG = {
  Active: { color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)' },
  Pending: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)' },
  Inactive: { color: '#fb7185', bg: 'rgba(251,113,133,0.1)', border: 'rgba(251,113,133,0.25)' },
};

/* ─── Glass field ─── */
const glassField = (disabled) => ({
  '& .MuiInputBase-root': {
    background: disabled ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.06)',
    border: `1px solid ${disabled ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.12)'}`,
    borderRadius: '12px',
    color: disabled ? 'rgba(255,255,255,0.35)' : '#f1f5f9',
    transition: 'border 0.25s, box-shadow 0.25s',
    '&:hover': !disabled ? { border: '1px solid rgba(99,179,237,0.45)' } : {},
    '&.Mui-focused': { border: '1px solid #63b3ed', boxShadow: '0 0 0 3px rgba(99,179,237,0.13)' },
  },
  '& .MuiInputBase-input': { color: disabled ? 'rgba(255,255,255,0.35)' : '#f1f5f9' },
  '& .MuiInputBase-inputMultiline': { color: disabled ? 'rgba(255,255,255,0.35)' : '#f1f5f9' },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.35)', fontSize: '0.855rem' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#63b3ed' },
  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
  '& .Mui-disabled .MuiInputBase-input': { WebkitTextFillColor: 'rgba(255,255,255,0.3)' },
  '& .MuiInputBase-root.Mui-disabled': { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' },
});

/* ─── Section label ─── */
const SectionLabel = ({ icon, label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, mt: 0.5 }}>
    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#63b3ed', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      {icon} {label}
    </Typography>
    <Box sx={{ flex: 1, height: '1px', background: 'rgba(99,179,237,0.15)' }} />
  </Box>
);

/* ─── Info chip (read-only) ─── */
const InfoChip = ({ label, value, config }) => (
  <Box sx={{
    display: 'inline-flex', alignItems: 'center', gap: 1,
    px: 2, py: 1, borderRadius: '10px',
    background: config?.bg || 'rgba(255,255,255,0.06)',
    border: `1px solid ${config?.border || 'rgba(255,255,255,0.1)'}`,
  }}>
    <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{label}:</Typography>
    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: config?.color || '#e2e8f0' }}>
      {config?.emoji ? `${config.emoji} ` : ''}{value}
    </Typography>
  </Box>
);

/* ─── Skeleton loader ─── */
const Skeleton = ({ w = '100%', h = 48, radius = 12 }) => (
  <Box sx={{
    width: w, height: h, borderRadius: `${radius}px`, background: 'rgba(255,255,255,0.05)',
    animation: 'shimmer 1.4s ease-in-out infinite', '@keyframes shimmer': { '0%,100%': { opacity: 0.4 }, '50%': { opacity: 0.8 } }
  }} />
);

export default function Profile() {
  const { user: authUser, setUser: setAuthUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      setUser(response.data);
      setEditData(response.data);
      setProfilePreview(response.data.profile_picture_url || response.data.profile_picture || null);
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      ['full_name', 'email', 'phone_number', 'address', 'about_yourself'].forEach(key => {
        const val = editData?.[key];
        if (val !== undefined && val !== null && val !== '') formData.append(key, val);
      });
      if (profileFile) formData.append('profile_picture', profileFile);
      const response = await userAPI.updateProfile(formData);
      setUser(response.data);
      setAuthUser(response.data);
      setIsEditing(false);
      setProfileFile(null);
      setProfilePreview(response.data.profile_picture_url || response.data.profile_picture || null);
      toast.success('Profile updated successfully!');
    } catch (error) {
      const message = error.response?.data && typeof error.response.data === 'object' && Object.values(error.response.data)[0]?.[0];
      toast.error(message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const handleCancel = () => {
    setEditData(user);
    setProfileFile(null);
    setProfilePreview(user?.profile_picture_url || user?.profile_picture || null);
    setIsEditing(false);
  };

  const handleProfileFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileFile(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const canEdit = authUser?.role === 'Admin' || authUser?.id === user?.id;
  const roleConf = ROLE_CONFIG[user?.role] || {};
  const statusConf = STATUS_CONFIG[user?.status] || {};

  return (
    <Box sx={{
      minHeight: 'calc(100vh - 96px)',
      background: 'linear-gradient(135deg,#0a0f1e 0%,#0d1f3c 50%,#071422 100%)',
      fontFamily: "'Sora','Nunito',sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Orbs */}
      <Box sx={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,189,248,0.06) 0%,transparent 70%)', top: '-18%', right: '-8%', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle,rgba(129,140,248,0.05) 0%,transparent 70%)', bottom: '-10%', left: '-6%', pointerEvents: 'none' }} />

      <Container maxWidth="md" sx={{ py: 5, position: 'relative', zIndex: 1 }}>

        {/* ── Page title ── */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, mb: 4,
          animation: 'fadeDown 0.45s ease both',
          '@keyframes fadeDown': { from: { opacity: 0, transform: 'translateY(-12px)' }, to: { opacity: 1, transform: 'none' } },
        }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg,#38bdf8,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
            👤
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>My Profile</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>Manage your personal information</Typography>
          </Box>
        </Box>

        {/* ── Main card ── */}
        <Box sx={{
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.032)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
          overflow: 'hidden',
          animation: 'cardIn 0.55s cubic-bezier(.22,1,.36,1) 0.1s both',
          '@keyframes cardIn': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'none' } },
        }}>

          {/* ── Hero banner ── */}
          <Box sx={{
            position: 'relative', px: { xs: 3, md: 5 }, pt: 5, pb: 8,
            background: 'linear-gradient(135deg,rgba(56,189,248,0.08) 0%,rgba(129,140,248,0.08) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            overflow: 'hidden',
          }}>
            {/* decorative rings */}
            {[200, 140, 80].map((s, i) => (
              <Box key={i} sx={{
                position: 'absolute', width: s, height: s, borderRadius: '50%',
                border: `1px solid rgba(99,179,237,${0.05 + i * 0.03})`,
                top: -s / 3, right: -s / 4,
                animation: `ring 4s ease-in-out ${i * 0.5}s infinite alternate`,
                '@keyframes ring': { from: { transform: 'scale(1)', opacity: 0.5 }, to: { transform: 'scale(1.05)', opacity: 1 } },
              }} />
            ))}

            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 3, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>

              {/* Avatar */}
              <Box sx={{ position: 'relative' }}
                onMouseEnter={() => setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}>
                <Box sx={{
                  width: 110, height: 110, borderRadius: '26px',
                  background: profilePreview ? 'transparent' : avatarGrad(user?.full_name),
                  border: '3px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
                  overflow: 'hidden', position: 'relative',
                  transition: 'box-shadow 0.25s',
                  '&:hover': { boxShadow: '0 16px 44px rgba(56,189,248,0.3)' },
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2.5rem', fontWeight: 800, color: '#fff',
                }}>
                  {loading ? null : profilePreview
                    ? <Box component="img" src={profilePreview} alt="avatar"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (user?.full_name?.[0] || 'U').toUpperCase()
                  }
                  {/* Camera overlay */}
                  {canEdit && (
                    <Box component="label" sx={{
                      position: 'absolute', inset: 0, cursor: 'pointer',
                      background: 'rgba(0,0,0,0.55)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: avatarHover ? 1 : 0,
                      transition: 'opacity 0.22s',
                      borderRadius: '23px',
                    }}>
                      <CameraAlt sx={{ fontSize: 28, color: '#fff' }} />
                      <input type="file" hidden accept="image/*" onChange={handleProfileFileChange} />
                    </Box>
                  )}
                </Box>
                {/* Edit indicator dot */}
                {profileFile && (
                  <Box sx={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', bgcolor: '#34d399', border: '2px solid #0d1f3c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ fontSize: '0.5rem', color: '#fff' }}>✓</Box>
                  </Box>
                )}
              </Box>

              {/* User info */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {loading ? (
                  <>
                    <Skeleton w="55%" h={28} radius={8} />
                    <Box sx={{ mt: 1 }}><Skeleton w="38%" h={18} radius={6} /></Box>
                  </>
                ) : (
                  <>
                    <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.1, mb: 1 }}>
                      {user?.full_name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.38)', mb: 2 }}>
                      {user?.email}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <InfoChip label="Role" value={user?.role} config={roleConf} />
                      <InfoChip label="Status" value={user?.status} config={statusConf} />
                      {user?.specialization && (
                        <InfoChip label="Specialty" value={user.specialization} config={{ color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.25)' }} />
                      )}
                    </Box>
                  </>
                )}
              </Box>

              {/* Edit / Save / Cancel buttons */}
              {canEdit && !loading && (
                <Box sx={{ display: 'flex', gap: 1, alignSelf: 'flex-start', flexShrink: 0 }}>
                  {!isEditing ? (
                    <Button startIcon={<Edit sx={{ fontSize: 16 }} />} onClick={() => setIsEditing(true)}
                      sx={{
                        px: 2.5, py: 1, borderRadius: '10px', textTransform: 'none',
                        fontWeight: 700, fontSize: '0.82rem', fontFamily: 'inherit',
                        background: 'rgba(99,179,237,0.12)', border: '1px solid rgba(99,179,237,0.3)',
                        color: '#63b3ed', transition: 'all 0.2s',
                        '&:hover': { background: 'rgba(99,179,237,0.22)', transform: 'translateY(-1px)' },
                      }}>
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button startIcon={saving ? null : <Save sx={{ fontSize: 16 }} />} onClick={handleSave} disabled={saving}
                        sx={{
                          px: 2.5, py: 1, borderRadius: '10px', textTransform: 'none',
                          fontWeight: 700, fontSize: '0.82rem', fontFamily: 'inherit',
                          background: 'linear-gradient(135deg,#38bdf8,#818cf8)', color: '#fff',
                          boxShadow: '0 4px 16px rgba(56,189,248,0.3)',
                          '&:hover:not(:disabled)': { opacity: 0.9, transform: 'translateY(-1px)' },
                        }}>
                        {saving
                          ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <Box sx={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }} />
                            Saving…
                          </Box>
                          : 'Save Changes'
                        }
                      </Button>
                      <Button startIcon={<Close sx={{ fontSize: 16 }} />} onClick={handleCancel} disabled={saving}
                        sx={{
                          px: 2, py: 1, borderRadius: '10px', textTransform: 'none',
                          fontWeight: 600, fontSize: '0.82rem', fontFamily: 'inherit',
                          background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.25)',
                          color: '#fb7185', transition: 'all 0.2s',
                          '&:hover:not(:disabled)': { background: 'rgba(251,113,133,0.2)' },
                        }}>
                        Cancel
                      </Button>
                    </>
                  )}
                </Box>
              )}
            </Box>
          </Box>

          {/* ── Form fields ── */}
          <Box sx={{ px: { xs: 3, md: 5 }, py: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[...Array(5)].map((_, i) => <Skeleton key={i} h={52} />)}
              </Box>
            ) : (
              <>
                <SectionLabel icon="📋" label="Personal Details" />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField label="Full Name" name="full_name"
                    value={editData?.full_name || ''} onChange={handleInputChange}
                    disabled={!isEditing} fullWidth sx={glassField(!isEditing)} />
                  <TextField label="Email Address" name="email"
                    value={editData?.email || ''} onChange={handleInputChange}
                    disabled={!isEditing} fullWidth sx={glassField(!isEditing)} />
                  <TextField label="Phone Number" name="phone_number"
                    value={editData?.phone_number || ''} onChange={handleInputChange}
                    disabled={!isEditing} fullWidth sx={glassField(!isEditing)} />
                  <TextField label="Role" value={user?.role || ''} disabled fullWidth sx={glassField(true)} />
                </Box>

                <TextField label="Address" name="address"
                  value={editData?.address || ''} onChange={handleInputChange}
                  multiline rows={2} disabled={!isEditing} fullWidth sx={glassField(!isEditing)} />

                <TextField label="About Yourself" name="about_yourself"
                  value={editData?.about_yourself || ''} onChange={handleInputChange}
                  multiline rows={3} disabled={!isEditing} fullWidth sx={glassField(!isEditing)} />

                <SectionLabel icon="🔒" label="Account Info" />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField label="Account Status" value={user?.status || ''} disabled fullWidth sx={glassField(true)} />
                  {user?.date_of_birth && (
                    <TextField label="Date of Birth" value={user.date_of_birth} disabled fullWidth sx={glassField(true)} />
                  )}
                </Box>

                {/* Edit mode hint */}
                {isEditing && (
                  <Box sx={{
                    mt: 0.5, px: 2, py: 1.5, borderRadius: '12px',
                    background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.18)',
                    display: 'flex', gap: 1.5, alignItems: 'center',
                    animation: 'fadeIn 0.3s ease both',
                    '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } },
                  }}>
                    <Box sx={{ fontSize: '0.9rem' }}>💡</Box>
                    <Typography sx={{ fontSize: '0.78rem', color: 'rgba(56,189,248,0.8)' }}>
                      Hover over your avatar to change your profile picture. Click Save Changes when done.
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}