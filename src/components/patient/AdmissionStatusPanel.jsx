import React from 'react';
import { Card, CardContent, Typography, Chip, Stack } from '@mui/material';

export default function AdmissionStatusPanel({ admissions = [] }) {
  const latest = admissions[0];
  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Admission Status</Typography>
        {!latest ? (
          <Typography color="text.secondary">No admission records.</Typography>
        ) : (
          <>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Chip
                label={latest.is_currently_admitted ? 'Admitted' : 'Discharged'}
                color={latest.is_currently_admitted ? 'warning' : 'success'}
              />
              <Chip label={`Stay: ${latest.stay_days} day(s)`} />
            </Stack>
            <Typography color="text.secondary">From: {latest.admitted_on}</Typography>
            <Typography color="text.secondary">To: {latest.discharged_on || 'Present'}</Typography>
            <Typography color="text.secondary">Updated: {latest.updated_at ? new Date(latest.updated_at).toLocaleString() : '-'}</Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}
