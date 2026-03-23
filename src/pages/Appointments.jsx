import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  IconButton,
  Skeleton,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import { appointmentAPI, doctorAPI } from '../services/api';
import { toast } from 'react-toastify';
import AppointmentCard from '../components/AppointmentCard';

const AppointmentForm = ({ open, onClose, onSave, doctors, loading, appointment }) => {
    const [formData, setFormData] = useState({
        patient_name: '',
        patient_age: '',
        patient_disease: '',
        contact_number: '',
        address: '',
        doctor: '',
        appointment_date: dayjs(),
        appointment_time: dayjs(),
      });

    useEffect(() => {
        if (appointment) {
            setFormData({
                ...appointment,
                appointment_date: dayjs(appointment.appointment_date),
                appointment_time: dayjs(appointment.appointment_time, 'HH:mm:ss'),
            });
        }
    }, [appointment]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const rawTime = formData.appointment_time?.format('HH:mm:ss') || '';
    const dataToSave = {
        ...formData,
        patient_age: parseInt(formData.patient_age, 10),
        appointment_date: formData.appointment_date.format('YYYY-MM-DD'),
        appointment_time: rawTime.split(':').length === 2 ? `${rawTime}:00` : rawTime,
    };
    onSave(dataToSave);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth disableRestoreFocus>
      <DialogTitle>{appointment ? 'Edit Appointment' : 'New Appointment'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Patient Name"
              value={formData.patient_name}
              onChange={(e) => handleChange('patient_name', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Patient Age"
              type="number"
              value={formData.patient_age}
              onChange={(e) => handleChange('patient_age', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Reason for Visit"
              value={formData.patient_disease}
              onChange={(e) => handleChange('patient_disease', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Number"
              value={formData.contact_number}
              onChange={(e) => handleChange('contact_number', e.target.value)}
            />
          </Grid>
           <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Doctor"
              value={formData.doctor}
              onChange={(e) => handleChange('doctor', e.target.value)}
            >
              {doctors.map(doc => (
                <MenuItem key={doc.id} value={doc.id}>{doc.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Appointment Date"
              value={formData.appointment_date}
              onChange={(newValue) => handleChange('appointment_date', newValue)}
              slots={{ textField: TextField }}
              slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TimePicker
              label="Appointment Time"
              value={formData.appointment_time}
              onChange={(newValue) => handleChange('appointment_time', newValue)}
              slots={{ textField: TextField }}
              slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};


const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data } = await appointmentAPI.getAll();
      setAppointments(data.results || data);
    } catch (error) {
      toast.error('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data } = await doctorAPI.getAll();
      setDoctors(data.results || data);
    } catch (error) {
      toast.error('Failed to load doctors.');
    }
  };

  const handleSave = async (appointmentData) => {
    setLoading(true);
    try {
      if (selectedAppointment) {
        await appointmentAPI.update(selectedAppointment.id, appointmentData);
        toast.success('Appointment updated successfully!');
      } else {
        await appointmentAPI.create(appointmentData);
        toast.success('Appointment created successfully!');
      }
      fetchAppointments();
      setFormOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      const details = error.response?.data;
      console.error('Appointment error details:', details);
      toast.error(details ? JSON.stringify(details) : 'Failed to save appointment.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await appointmentAPI.delete(id);
        toast.success('Appointment deleted successfully!');
        fetchAppointments();
      } catch (error) {
        toast.error('Failed to delete appointment.');
      }
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight="bold">
            Appointments
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setSelectedAppointment(null);
              setFormOpen(true);
            }}
          >
            New Appointment
          </Button>
        </Box>

        <Grid container spacing={3}>
          {loading ? (
            Array.from(new Array(6)).map((_, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Skeleton variant="rectangular" height={200} />
              </Grid>
            ))
          ) : (
            appointments.map(app => (
              <Grid item xs={12} md={6} lg={4} key={app.id}>
                <AppointmentCard
                  appointment={app}
                  onEdit={() => {
                    setSelectedAppointment(app);
                    setFormOpen(true);
                  }}
                  onDelete={() => handleDelete(app.id)}
                />
              </Grid>
            ))
          )}
        </Grid>

        {formOpen && (
          <AppointmentForm
            open={formOpen}
            onClose={() => {
              setFormOpen(false);
              setSelectedAppointment(null);
            }}
            onSave={handleSave}
            doctors={doctors}
            loading={loading}
            appointment={selectedAppointment}
          />
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default Appointments;
