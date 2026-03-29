/**
 * Dashboard Page - Role-based - Enhanced UI
 */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
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

/* ─── Animated number counter ─── */
const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) return;
    let start = 0;
    const end = parseInt(value, 10);
    if (end === 0) return;
    const duration = 900;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
};

/* ─── Stat card ─── */
const StatCard = ({ title, value, icon, gradient, delay = 0 }) => (
  <Box sx={{
    borderRadius: '20px',
    background: 'rgba(255,255,255,0.042)',
    border: '1px solid rgba(255,255,255,0.09)',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
    overflow: 'hidden',
    position: 'relative',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    animation: `cardIn 0.55s cubic-bezier(.22,1,.36,1) ${delay}s both`,
    '@keyframes cardIn': { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'none' } },
    '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 16px 48px rgba(0,0,0,0.38)' },
  }}>
    {/* Top gradient accent bar */}
    <Box sx={{ height: 3, background: gradient }} />

    {/* Glow blob */}
    <Box sx={{
      position: 'absolute', width: 120, height: 120, borderRadius: '50%',
      background: gradient, opacity: 0.07, top: -20, right: -20,
      filter: 'blur(30px)', pointerEvents: 'none',
    }} />

    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
        <Box sx={{
          width: 46, height: 46, borderRadius: '13px',
          background: gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        }}>
          <Box sx={{ color: '#fff', display: 'flex', '& svg': { fontSize: 22 } }}>{icon}</Box>
        </Box>
        {/* Pulse dot */}
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: gradient,
            animation: 'pulseDot 2s ease-in-out infinite', '@keyframes pulseDot': {
              '0%,100%': { transform: 'scale(1)', opacity: 1 },
              '50%': { transform: 'scale(1.6)', opacity: 0.5 },
            }}} />
        </Box>
      </Box>
      <Typography sx={{ fontSize: '2.6rem', fontWeight: 800, lineHeight: 1, mb: 0.5,
        background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        <AnimatedNumber value={value} />
      </Typography>
      <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.42)', fontWeight: 500, letterSpacing: '0.04em' }}>
        {title}
      </Typography>
    </Box>
  </Box>
);

/* ─── Section header ─── */
const SectionHeader = ({ title }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0' }}>{title}</Typography>
    <Box sx={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
  </Box>
);

/* ─── Loading skeleton ─── */
const SkeletonCard = () => (
  <Box sx={{ borderRadius: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', height: 140,
    overflow: 'hidden', position: 'relative', '&::after': {
      content: '""', position: 'absolute', inset: 0,
      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
      animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%',
      '@keyframes shimmer': { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
    }}} />
);

const GRADIENTS = {
  cyan:    'linear-gradient(135deg,#38bdf8,#0ea5e9)',
  green:   'linear-gradient(135deg,#34d399,#059669)',
  indigo:  'linear-gradient(135deg,#818cf8,#6366f1)',
  amber:   'linear-gradient(135deg,#fbbf24,#f59e0b)',
  rose:    'linear-gradient(135deg,#fb7185,#e11d48)',
  teal:    'linear-gradient(135deg,#2dd4bf,#0d9488)',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Box sx={{
      minHeight: 'calc(100vh - 96px)',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1f3c 50%, #071422 100%)',
      position: 'relative', overflow: 'hidden',
      fontFamily: "'Sora', 'Nunito', sans-serif",
    }}>
      {/* Ambient orbs */}
      <Box sx={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)', top: '-20%', right: '-10%', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.05) 0%, transparent 70%)', bottom: '-10%', left: '-8%', pointerEvents: 'none' }} />

      <Container maxWidth="xl" sx={{ py: 5, position: 'relative', zIndex: 1 }}>

        {/* ── Top bar ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 5,
          animation: 'fadeDown 0.5s ease both',
          '@keyframes fadeDown': { from: { opacity: 0, transform: 'translateY(-16px)' }, to: { opacity: 1, transform: 'none' } },
        }}>
          <Box>
            <Typography sx={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5 }}>
              {greeting} 👋
            </Typography>
            <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.15 }}>
              {user?.full_name || 'Dashboard'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.8 }}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#34d399', boxShadow: '0 0 8px #34d399',
                animation: 'pulse 2s ease-in-out infinite', '@keyframes pulse': {
                  '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 }
                }}} />
              <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.38)' }}>
                Live hospital activity · {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Typography>
            </Box>
          </Box>
          <Button
            onClick={() => window.location.href = '/appointments'}
            sx={{
              px: 3, py: 1.3, borderRadius: '12px', fontWeight: 700, fontSize: '0.875rem',
              textTransform: 'none', fontFamily: 'inherit',
              background: 'linear-gradient(135deg,#38bdf8,#818cf8)',
              color: '#fff', boxShadow: '0 4px 18px rgba(56,189,248,0.3)',
              transition: 'all 0.25s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 28px rgba(56,189,248,0.42)' },
            }}
          >
            View Appointments
          </Button>
        </Box>

        {/* ── Role badge ── */}
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: 1, mb: 4,
          px: 2, py: 0.8, borderRadius: '10px',
          background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
        }}>
          <Box sx={{ fontSize: '0.85rem' }}>
            {user?.role === 'Admin' ? '⚙️' : user?.role === 'Doctor' ? '🩺' : user?.role === 'Receptionist' ? '📋' : '🏥'}
          </Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#63b3ed', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {user?.role} Dashboard
          </Typography>
        </Box>

        {/* ── Stat cards ── */}
        {loading ? (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[...Array(4)].map((_, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}><SkeletonCard /></Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={3} sx={{ mb: 5 }}>
            {user?.role === 'Admin' && (<>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title="Total Doctors" value={stats?.total_doctors} icon={<LocalHospital />} gradient={GRADIENTS.cyan} delay={0} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title="Total Patients" value={stats?.total_patients} icon={<People />} gradient={GRADIENTS.green} delay={0.07} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title="Total Appointments" value={stats?.total_appointments} icon={<CalendarToday />} gradient={GRADIENTS.indigo} delay={0.14} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title="Pending Users" value={stats?.pending_users} icon={<People />} gradient={GRADIENTS.amber} delay={0.21} />
              </Grid>
            </>)}

            {(user?.role === 'Doctor' || user?.role === 'Receptionist') && (<>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard title="Total Appointments" value={stats?.total_appointments} icon={<CalendarToday />} gradient={GRADIENTS.cyan} delay={0} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard title="Today's Appointments" value={stats?.today_appointments} icon={<CalendarToday />} gradient={GRADIENTS.indigo} delay={0.08} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard title="Pending Appointments" value={stats?.pending_appointments} icon={<CalendarToday />} gradient={GRADIENTS.amber} delay={0.16} />
              </Grid>
            </>)}
          </Grid>
        )}

        {/* ── Recent Call Logs ── */}
        {stats?.recent_calls && stats.recent_calls.length > 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Box sx={{
                borderRadius: '20px', p: 3,
                background: 'rgba(255,255,255,0.038)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                animation: 'cardIn 0.6s ease 0.3s both',
              }}>
                <SectionHeader title="📞 Recent Call Logs" />
                <Box sx={{ maxHeight: 310, overflow: 'auto', pr: 0.5,
                  '&::-webkit-scrollbar': { width: 4 },
                  '&::-webkit-scrollbar-track': { background: 'transparent' },
                  '&::-webkit-scrollbar-thumb': { background: 'rgba(99,179,237,0.25)', borderRadius: 2 },
                }}>
                  {stats.recent_calls.map((call, index) => (
                    <Box key={index} sx={{
                      display: 'flex', alignItems: 'center', gap: 2,
                      p: 2, mb: 1.5, borderRadius: '12px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      transition: 'background 0.2s',
                      animation: `fadeRow 0.4s ease ${index * 0.06}s both`,
                      '@keyframes fadeRow': { from: { opacity: 0, transform: 'translateX(-10px)' }, to: { opacity: 1, transform: 'none' } },
                      '&:hover': { background: 'rgba(99,179,237,0.07)' },
                    }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: GRADIENTS.teal,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Phone sx={{ fontSize: 16, color: '#fff' }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600 }}>
                          {call.caller_number}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.38)', mt: 0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {call.intent}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.28)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {new Date(call.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* ── Quick summary panel ── */}
            <Grid item xs={12} md={5}>
              <Box sx={{
                borderRadius: '20px', p: 3, height: '100%',
                background: 'linear-gradient(145deg, rgba(56,189,248,0.07) 0%, rgba(129,140,248,0.07) 100%)',
                border: '1px solid rgba(99,179,237,0.15)',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                animation: 'cardIn 0.6s ease 0.38s both',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
              }}>
                <SectionHeader title="📊 Quick Summary" />
                {[
                  { label: 'Total Calls Today', value: stats.recent_calls.length, color: '#38bdf8' },
                  { label: 'Unique Callers', value: new Set(stats.recent_calls.map(c => c.caller_number)).size, color: '#818cf8' },
                  { label: 'Latest Intent', value: stats.recent_calls[0]?.intent || '—', color: '#34d399', isText: true },
                ].map((item, i) => (
                  <Box key={i} sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    py: 1.5, borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}>
                    <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: item.isText ? '0.78rem' : '1.1rem', fontWeight: 700, color: item.color,
                      maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {item.isText ? item.value : <AnimatedNumber value={item.value} />}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
}