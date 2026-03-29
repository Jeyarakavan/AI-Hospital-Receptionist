import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export default function ChangePassword() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await userAPI.updatePassword({ 
        password: newPassword,
        has_changed_password: true 
      });
      
      toast.success('Password updated successfully! Please log in again.');
      // Update local user state
      setUser({ ...user, has_changed_password: true });
      
      // Logout to force clean session with new password
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Welcome, Dr. {user?.full_name}
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          This is your first login. For security reasons, please set a new password for your account.
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
          Your initial password was your username. Please choose a strong, unique password now.
        </Alert>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            sx={{ mb: 3 }}
          />
          
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ py: 1.5, fontSize: '1.1rem' }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Set New Password'}
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
