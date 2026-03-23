import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  PersonAdd,
  Search,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { doctorAPI } from '../services/api';
import { toast } from 'react-toastify';

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data } = await doctorAPI.getAll();
      setDoctors(data.results || data);
    } catch (error) {
      toast.error('Failed to load doctors.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (doctorId) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await doctorAPI.delete(doctorId);
        toast.success('Doctor deleted successfully!');
        fetchDoctors();
      } catch (error) {
        toast.error('Failed to delete doctor.');
      }
    }
  };

  const filteredDoctors = (Array.isArray(doctors) ? doctors : []).filter(doc => {
    if (!doc) return false;
    const q = filter.toLowerCase();
    return (
      (doc.user?.full_name || '').toLowerCase().includes(q) ||
      (doc.specialization || '').toLowerCase().includes(q)
    );
  });

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight="bold">
            Doctor Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => navigate('/register-user')}
          >
            Add Doctor
          </Button>
        </Box>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by name or specialization..."
            onChange={(e) => setFilter(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Specialization</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDoctors
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((doctor) => (
                  <TableRow key={doctor.id} hover>
                    <TableCell>{doctor.user?.full_name || 'N/A'}</TableCell>
                    <TableCell>{doctor.specialization || 'N/A'}</TableCell>
                    <TableCell>{doctor.user?.email || 'N/A'}</TableCell>
                    <TableCell>{doctor.user?.phone_number || 'N/A'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => navigate(`/doctors/${doctor.id}`)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Doctor">
                        <IconButton size="small" onClick={() => navigate(`/doctors/edit/${doctor.id}`)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Doctor">
                        <IconButton size="small" onClick={() => handleDelete(doctor.id)}>
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredDoctors.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </CardContent>
    </Card>
  );
};

export default DoctorManagement;
