/**
 * User Management Page (Admin only)
 */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';
import { Check, Close, Block } from '@mui/icons-material';
import { userAPI } from '../services/api';
import { toast } from 'react-toastify';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionDialog, setActionDialog] = useState(false);

  useEffect(() => {
    loadUsers();
    loadPendingUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAllUsers();
      setUsers(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const loadPendingUsers = async () => {
    try {
      const response = await userAPI.getPendingUsers();
      setPendingUsers(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load pending users');
    }
  };

  const handleApprove = async (userId, action) => {
    try {
      const response = await userAPI.approveUser(userId, action);
      toast.success(`User ${action}d successfully`);
      setActionDialog(false);
      setSelectedUser(null);
      loadUsers();
      loadPendingUsers();
    } catch (error) {
      let errorMsg = 'Failed to process request';
      
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.response?.data?.detail) {
        errorMsg = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.status === 403) {
        errorMsg = 'You do not have permission to approve users. Only admins can approve users.';
      } else if (error.response?.status === 404) {
        errorMsg = 'User not found';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      console.error('Approval error:', error);
      toast.error(errorMsg);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Rejected':
        return 'error';
      case 'Disabled':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        User Management
      </Typography>

      {/* Pending Users */}
      {pendingUsers.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Pending Approvals
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Chip label={user.status} color={getStatusColor(user.status)} size="small" />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => {
                          setSelectedUser(user);
                          setActionDialog(true);
                        }}
                      >
                        <Check />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleApprove(user.id, 'reject')}
                      >
                        <Close />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* All Users */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Chip label={user.status} color={getStatusColor(user.status)} size="small" />
                </TableCell>
                <TableCell>
                  {user.status === 'Approved' && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleApprove(user.id, 'disable')}
                    >
                      <Block />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={actionDialog} onClose={() => setActionDialog(false)}>
        <DialogTitle>Approve User</DialogTitle>
        <DialogContent>
          <Typography>
            Approve {selectedUser?.full_name} ({selectedUser?.role})?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleApprove(selectedUser?.id, 'approve')}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
