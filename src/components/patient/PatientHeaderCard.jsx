import React from 'react';
import { Card, CardContent, Grid, Typography, Chip, Stack } from '@mui/material';

export default function PatientHeaderCard({ patient, profile }) {
  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{patient?.name || '-'}</Typography>
            <Typography color="text.secondary">{patient?.email || 'No email'}</Typography>
            <Typography color="text.secondary">{patient?.phone_number || 'No phone'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Chip label={`Age: ${patient?.age ?? '-'}`} />
              <Chip label={`IC: ${profile?.ic_number || '-'}`} color="primary" variant="outlined" />
            </Stack>
            <Typography sx={{ mt: 1 }} color="text.secondary">
              {patient?.address || 'No address'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
