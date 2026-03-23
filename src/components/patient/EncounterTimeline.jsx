import React from 'react';
import { Card, CardContent, Typography, Divider, Stack, Chip } from '@mui/material';

export default function EncounterTimeline({ encounters = [] }) {
  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Encounter Timeline</Typography>
        {encounters.length === 0 ? (
          <Typography color="text.secondary">No encounter history yet.</Typography>
        ) : (
          encounters.map((enc, idx) => (
            <Stack key={enc.id} spacing={1} sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1}>
                <Chip size="small" label={enc.encounter_date} />
                <Chip size="small" label={enc.created_at ? new Date(enc.created_at).toLocaleString() : 'No timestamp'} variant="outlined" />
                <Chip size="small" label={enc.doctor_name || 'Unknown doctor'} color="primary" variant="outlined" />
              </Stack>
              <Typography sx={{ fontWeight: 500 }}>{enc.current_situation || 'Clinical update'}</Typography>
              <Typography color="text.secondary">{enc.notes}</Typography>
              {!!enc.prescriptions?.length && (
                <Typography variant="body2" color="text.secondary">
                  Medicines: {enc.prescriptions.map((p) => p.medicine_name).join(', ')}
                </Typography>
              )}
              {idx < encounters.length - 1 && <Divider sx={{ pt: 1 }} />}
            </Stack>
          ))
        )}
      </CardContent>
    </Card>
  );
}
