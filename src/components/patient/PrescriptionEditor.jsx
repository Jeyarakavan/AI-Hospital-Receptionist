import React from 'react';
import { Box, Grid, TextField, Button } from '@mui/material';

export default function PrescriptionEditor({ prescriptions, setPrescriptions }) {
  const addPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' },
    ]);
  };

  const updatePrescription = (index, field, value) => {
    const updated = [...prescriptions];
    updated[index][field] = value;
    setPrescriptions(updated);
  };

  return (
    <Box>
      {prescriptions.map((item, index) => (
        <Grid container spacing={1} key={`rx-${index}`} sx={{ mb: 1 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Medicine"
              value={item.medicine_name}
              onChange={(e) => updatePrescription(index, 'medicine_name', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Dosage"
              value={item.dosage}
              onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Frequency"
              value={item.frequency}
              onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Duration"
              value={item.duration}
              onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Instructions"
              value={item.instructions}
              onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
            />
          </Grid>
        </Grid>
      ))}
      <Button variant="outlined" onClick={addPrescription}>Add Medicine</Button>
    </Box>
  );
}
