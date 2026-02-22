/**
 * Dashboard Page - Role-based
 */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import {
  People,
  CalendarToday,
  LocalHospital,
  Phone,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import { toast } from 'react-toastify';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ p: 4, textAlign: 'center' }}>Loading...</Box>;
  }

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              p: 1.5,
              borderRadius: 2,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 'bold', color: `${color}.main` }}>
          {value || 0}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Welcome, {user?.full_name}!
      </Typography>

      <Grid container spacing={3}>
        {user?.role === 'Admin' && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Doctors"
                value={stats?.total_doctors}
                icon={<LocalHospital />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Patients"
                value={stats?.total_patients}
                icon={<People />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Appointments"
                value={stats?.total_appointments}
                icon={<CalendarToday />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Pending Users"
                value={stats?.pending_users}
                icon={<People />}
                color="warning"
              />
            </Grid>
          </>
        )}

        {user?.role === 'Doctor' && (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Total Appointments"
                value={stats?.total_appointments}
                icon={<CalendarToday />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Today's Appointments"
                value={stats?.today_appointments}
                icon={<CalendarToday />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Pending Appointments"
                value={stats?.pending_appointments}
                icon={<CalendarToday />}
                color="warning"
              />
            </Grid>
          </>
        )}

        {user?.role === 'Receptionist' && (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Total Appointments"
                value={stats?.total_appointments}
                icon={<CalendarToday />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Today's Appointments"
                value={stats?.today_appointments}
                icon={<CalendarToday />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Pending Appointments"
                value={stats?.pending_appointments}
                icon={<CalendarToday />}
                color="warning"
              />
            </Grid>
          </>
        )}

        {/* Recent Calls */}
        {stats?.recent_calls && stats.recent_calls.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Recent Call Logs
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {stats.recent_calls.map((call, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      mb: 1,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2">
                      <strong>Caller:</strong> {call.caller_number} |{' '}
                      <strong>Intent:</strong> {call.intent} |{' '}
                      <strong>Time:</strong>{' '}
                      {new Date(call.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}
