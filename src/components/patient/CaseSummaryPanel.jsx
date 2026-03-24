import React from 'react';
import { Card, CardContent, Typography, Chip, Stack } from '@mui/material';

export default function CaseSummaryPanel({ patientCase }) {
  if (!patientCase) return null;
  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Chip label={patientCase.status} color="info" size="small" />
          <Chip label={patientCase.is_active ? 'Active Case' : 'Closed Case'} size="small" />
        </Stack>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Diagnosis</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>{patientCase.diagnosis}</Typography>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Current Condition</Typography>
        <Typography color="text.secondary">{patientCase.current_condition || 'No condition update yet.'}</Typography>
      </CardContent>
    </Card>
  );
}
