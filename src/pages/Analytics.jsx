import React, { useState, useEffect } from 'react';
import {
  Box, Container, Grid, Paper, Typography, CircularProgress,
} from '@mui/material';
import {
  TrendingUp, People, Phone, Event, AccessTime, CheckCircleOutline,
} from '@mui/icons-material';
import { dashboardAPI } from '../services/api';
import { toast } from 'react-toastify';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const APPOINTMENT_COLORS = ['#4caf50', '#ff9800', '#f44336', '#2196f3'];
const STAFF_COLORS = ['#1976d2', '#9c27b0', '#00bcd4', '#ff5722', '#607d8b'];

const StatCard = ({ title, value, icon: Icon, color = 'primary.main' }) => (
  <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
    <Box sx={{ bgcolor: color, borderRadius: 2, p: 1.5, display: 'flex', color: 'white' }}>
      <Icon />
    </Box>
    <Box>
      <Typography variant="body2" color="text.secondary">{title}</Typography>
      <Typography variant="h5" fontWeight="bold">{value}</Typography>
    </Box>
  </Paper>
);

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await dashboardAPI.getStats();
      setStats(res.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>Analytics</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Staff" value={stats?.total_staff || 0} icon={People} color="primary.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Appointments" value={stats?.total_appointments || 0} icon={Event} color="success.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Calls" value={stats?.total_calls || 0} icon={Phone} color="warning.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Avg Call Duration" value={`${stats?.avg_call_duration || 0}s`} icon={AccessTime} color="info.main" />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Staff Breakdown</Typography>
            {stats?.staff_breakdown && Object.keys(stats.staff_breakdown).length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={Object.entries(stats.staff_breakdown).map(([role, count]) => ({ role, count }))}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="role" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {Object.keys(stats.staff_breakdown).map((_, i) => (
                        <Cell key={i} fill={STAFF_COLORS[i % STAFF_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {Object.entries(stats.staff_breakdown).map(([role, count]) => (
                  <Box key={role} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="body2">{role}</Typography>
                    <Typography variant="body2" fontWeight="bold">{count}</Typography>
                  </Box>
                ))}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">No data available</Typography>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Appointment Outcomes</Typography>
            {stats ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: stats.completed_appointments || 0 },
                      { name: 'Pending', value: stats.pending_appointments || 0 },
                      { name: 'Cancelled', value: stats.cancelled_appointments || 0 },
                      { name: 'Confirmed', value: stats.confirmed_appointments || 0 },
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {APPOINTMENT_COLORS.map((color, i) => (
                      <Cell key={i} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">No data available</Typography>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
              <Typography variant="body2">Completed Appointments</Typography>
              <Typography variant="body2" fontWeight="bold">{stats?.completed_appointments || 0}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
              <Typography variant="body2">Pending Appointments</Typography>
              <Typography variant="body2" fontWeight="bold">{stats?.pending_appointments || 0}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
              <Typography variant="body2">Cancelled Appointments</Typography>
              <Typography variant="body2" fontWeight="bold">{stats?.cancelled_appointments || 0}</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
