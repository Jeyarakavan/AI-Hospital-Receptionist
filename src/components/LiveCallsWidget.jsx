import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { PhoneInTalk, TransferWithinAStation, HourglassEmpty } from '@mui/icons-material';
import { useSocket } from '../context/SocketContext';
import CallCard from './CallCard';

const LiveCallsWidget = () => {
  const { activeCalls, humanQueue } = useSocket();

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="div" fontWeight="bold" gutterBottom>
          Live Call Center
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              Active AI Conversations ({activeCalls.length})
            </Typography>
            {activeCalls.length > 0 ? (
              <Grid container spacing={2}>
                {activeCalls.map((call) => (
                  <Grid item xs={12} sm={6} key={call.call_sid}>
                    <CallCard call={call} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', p: 3 }}>
                <HourglassEmpty sx={{ mr: 1 }} />
                <Typography>No active AI calls at the moment.</Typography>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              Human Transfer Queue ({humanQueue.length})
            </Typography>
            {humanQueue.length > 0 ? (
              humanQueue.map((entry) => (
                <Card
                  key={entry.call_sid}
                  variant="outlined"
                  sx={{
                    mb: 1.5,
                    borderColor: entry.queue === 'emergency' ? 'error.main' : 'divider',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" fontWeight="bold">
                        {entry.caller_number}
                      </Typography>
                      {entry.queue === 'emergency' && (
                        <Chip label="Emergency" color="error" size="small" />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Reason: {entry.reason}
                    </Typography>
                    <Tooltip title="Take over this call">
                      <IconButton size="small" sx={{ mt: 1 }}>
                        <TransferWithinAStation />
                      </IconButton>
                    </Tooltip>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', p: 3 }}>
                <HourglassEmpty sx={{ mr: 1 }} />
                <Typography>The transfer queue is empty.</Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default LiveCallsWidget;
