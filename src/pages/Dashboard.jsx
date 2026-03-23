import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  People,
  CalendarToday,
  LocalHospital,
  Phone,
  AccessTime,
  CheckCircle,
} from '@mui/icons-material';
import useAuth from '../hooks/useAuth';
import { dashboardAPI } from '../services/api';
import { toast } from 'react-toastify';
import LiveCallsWidget from '../components/LiveCallsWidget';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const StatCard = ({ title, value, icon, color, loading }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      {loading ? (
        <>
          <Skeleton variant="rectangular" width={40} height={40} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="40%" />
        </>
      ) : (
        <>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Box
              sx={{
                backgroundColor: `${color}.light`,
                color: `${color}.main`,
                p: 1,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </Box>
          </Box>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value}
          </Typography>
        </>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await dashboardAPI.getStats();
        setStats(data);
      } catch (error) {
        toast.error('Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statItems = [
    { title: 'Total Patients', value: stats?.total_patients, icon: <People />, color: 'primary' },
    { title: "Today's Appointments", value: stats?.today_appointments, icon: <CalendarToday />, color: 'secondary' },
    { title: 'Total Doctors', value: stats?.total_doctors, icon: <LocalHospital />, color: 'success' },
    { title: 'Total Calls', value: stats?.total_calls, icon: <Phone />, color: 'info' },
    { title: 'Avg. Call Duration', value: `${stats?.avg_call_duration || 0}s`, icon: <AccessTime />, color: 'warning' },
    { title: 'Completed Appts', value: stats?.completed_appointments, icon: <CheckCircle />, color: 'error' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Welcome back, {user?.full_name || user?.username || 'User'}!
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Here's a summary of the hospital's activity.
      </Typography>

      <Grid container spacing={3}>
        { (loading ? Array.from(new Array(6)) : statItems).map((item, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <StatCard
              loading={loading}
              title={item?.title}
              value={item?.value}
              icon={item?.icon}
              color={item?.color}
            />
          </Grid>
        ))}

        <Grid item xs={12}>
          <LiveCallsWidget />
        </Grid>

        {/* Appointment Status Breakdown */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Appointment Status Breakdown
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={260} />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: stats?.completed_appointments || 0 },
                        { name: 'Pending', value: stats?.pending_appointments || 0 },
                        { name: 'Cancelled', value: stats?.cancelled_appointments || 0 },
                        { name: 'Confirmed', value: stats?.confirmed_appointments || 0 },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {['#4caf50', '#ff9800', '#f44336', '#2196f3'].map((color, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Pie>
                    <ReTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Staff & Doctor Count */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Staff Overview
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={260} />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={
                      stats?.staff_breakdown
                        ? Object.entries(stats.staff_breakdown).map(([role, count]) => ({ role, count }))
                        : [
                            { role: 'Doctors', count: stats?.total_doctors || 0 },
                            { role: 'Staff', count: stats?.total_staff || 0 },
                          ]
                    }
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="role" />
                    <YAxis allowDecimals={false} />
                    <ReTooltip />
                    <Bar dataKey="count" fill="#1976d2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
