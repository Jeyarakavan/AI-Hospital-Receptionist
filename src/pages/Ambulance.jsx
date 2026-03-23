import React, { useState } from 'react';
import {
  Box, Container, Paper, TextField, Button, Typography, Grid,
  Stepper, Step, StepLabel, CircularProgress,
} from '@mui/material';
import { LocalHospital } from '@mui/icons-material';
import { ambulanceAPI } from '../services/api';
import { toast } from 'react-toastify';

export default function Ambulance() {
  const [form, setForm] = useState({
    patient_name: '',
    contact_number: '',
    pickup_location: '',
    condition: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Request Received', 'Ambulance Dispatched', 'En Route', 'Patient Onboard', 'Arrived at Hospital'];

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient_name || !form.contact_number || !form.pickup_location) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      await ambulanceAPI.create(form);
      toast.success('Ambulance request submitted!');
      setSubmitted(true);
      setActiveStep(1);
    } catch {
      toast.error('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <LocalHospital color="error" sx={{ fontSize: 32 }} />
        <Typography variant="h4" fontWeight="bold">Emergency Ambulance</Typography>
      </Box>

      {submitted ? (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>Ambulance Request Status</Typography>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Typography variant="body1" sx={{ mt: 3, textAlign: 'center' }}>
            Your ambulance request has been received. Help is on the way.
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>Request Ambulance</Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth required label="Patient Name" value={form.patient_name} onChange={handleChange('patient_name')} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth required label="Contact Number" value={form.contact_number} onChange={handleChange('contact_number')} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth required label="Pickup Location" value={form.pickup_location} onChange={handleChange('pickup_location')} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Condition / Notes" value={form.condition} onChange={handleChange('condition')} multiline rows={3} />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" color="error" size="large" disabled={loading} fullWidth>
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Request Ambulance'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}
    </Container>
  );
}
