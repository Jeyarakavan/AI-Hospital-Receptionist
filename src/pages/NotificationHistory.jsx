/**
 * Notification History Page
 * Shows all system-sent notifications — appointment confirmations, OTPs, approvals, etc.
 * Fetches from the Django backend which proxies to MongoDB
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Container, Typography, Chip, TextField, MenuItem, InputAdornment,
  CircularProgress, Tooltip, IconButton,
} from '@mui/material';
import { NotificationsActive, Search, Refresh, Email, CheckCircle, Cancel, Info } from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import dayjs from 'dayjs';

/* ─── Type config ─── */
const TYPE_META = {
  appointment_confirmed: { label: 'Appointment Confirmed', icon: '✅', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)' },
  appointment_booking:   { label: 'Booking',              icon: '📅', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.25)' },
  registration:          { label: 'Registration',         icon: '👤', color: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.25)' },
  account_approved:      { label: 'Approved',             icon: '✔️', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)' },
  account_rejected:      { label: 'Rejected',             icon: '❌', color: '#fb7185', bg: 'rgba(251,113,133,0.1)', border: 'rgba(251,113,133,0.25)' },
  account_disabled:      { label: 'Disabled',             icon: '🚫', color: '#fb7185', bg: 'rgba(251,113,133,0.1)', border: 'rgba(251,113,133,0.25)' },
  password_reset_otp:    { label: 'Password Reset',       icon: '🔐', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)' },
  sms:                   { label: 'SMS Sent',             icon: '📱', color: '#2dd4bf', bg: 'rgba(45,212,191,0.1)', border: 'rgba(45,212,191,0.25)' },
  email:                 { label: 'Email Sent',           icon: '📧', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)' },
};

const getMeta = (type) => TYPE_META[type] || { label: type || 'Info', icon: 'ℹ️', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)' };

/* ─── Row cell ─── */
const Cell = ({ children, sx = {} }) => (
  <Box sx={{ px: 2, py: 2, color: '#e2e8f0', fontSize: '0.84rem', borderBottom: '1px solid rgba(255,255,255,0.05)', ...sx }}>
    {children}
  </Box>
);

/* ─── Column header ─── */
const Col = ({ children, sx = {} }) => (
  <Box sx={{
    px: 2, py: 1.5,
    color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', fontWeight: 700,
    letterSpacing: '0.09em', textTransform: 'uppercase',
    background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.07)',
    ...sx,
  }}>
    {children}
  </Box>
);

const FILTERS = ['All', 'appointment_confirmed', 'registration', 'account_approved', 'account_rejected', 'password_reset_otp', 'sms', 'email'];

export default function NotificationHistory() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('notifications/history/');
      setNotifications(res.data || []);
    } catch (err) {
      // Fallback: try fetching from appointments as notification history
      try {
        const res2 = await api.get('appointments/?page_size=100');
        const appts = res2.data?.results || res2.data || [];
        setNotifications(appts.map(a => ({
          _id: a.id,
          notification_type: 'appointment_booking',
          title: `Appointment: ${a.patient_name}`,
          message: `Dr. ${a.doctor_name} — ${a.appointment_date} at ${a.appointment_time?.slice(0,5)}`,
          user_email: '',
          receiver_email: a.patient_email || '',
          purpose: 'appointment booking',
          timestamp: a.booking_time || a.updated_at,
          status: a.status,
        })));
      } catch { setNotifications([]); }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const filtered = notifications.filter(n => {
    const matchType = typeFilter === 'All' || n.notification_type === typeFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      n.title?.toLowerCase().includes(q) ||
      n.message?.toLowerCase().includes(q) ||
      n.user_email?.toLowerCase().includes(q) ||
      n.receiver_email?.toLowerCase().includes(q) ||
      n.purpose?.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'All' ? notifications.length : notifications.filter(n => n.notification_type === f).length;
    return acc;
  }, {});

  return (
    <Box sx={{
      minHeight: 'calc(100vh - 96px)',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1f3c 50%, #071422 100%)',
      fontFamily: "'Sora','Nunito',sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient orbs */}
      <Box sx={{ position: 'absolute', width: 460, height: 460, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,189,248,0.06) 0%,transparent 70%)', top: '-15%', right: '-8%', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle,rgba(129,140,248,0.05) 0%,transparent 70%)', bottom: '-10%', left: '-6%', pointerEvents: 'none' }} />

      <Container maxWidth="xl" sx={{ py: 5, position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 4,
          animation: 'fadeDown 0.5s ease both',
          '@keyframes fadeDown': { from: { opacity: 0, transform: 'translateY(-14px)' }, to: { opacity: 1, transform: 'none' } },
        }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg,#38bdf8,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <NotificationsActive sx={{ fontSize: 18, color: '#fff' }} />
              </Box>
              <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9' }}>
                Notification History
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', ml: 6.5 }}>
              {notifications.length} total notifications logged
            </Typography>
          </Box>
          <IconButton onClick={loadNotifications} sx={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(99,179,237,0.1)', border: '1px solid rgba(99,179,237,0.2)', color: '#63b3ed', '&:hover': { background: 'rgba(99,179,237,0.2)' } }}>
            <Refresh fontSize="small" />
          </IconButton>
        </Box>

        {/* ── Type filter pills ── */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          {FILTERS.map(f => {
            const meta = f === 'All' ? { color: '#63b3ed', bg: 'rgba(99,179,237,0.1)', border: 'rgba(99,179,237,0.3)' } : getMeta(f);
            const active = typeFilter === f;
            return (
              <Box key={f} onClick={() => { setTypeFilter(f); setPage(1); }} sx={{
                px: 2, py: 0.7, borderRadius: '10px', cursor: 'pointer',
                border: `1px solid ${active ? meta.border : 'rgba(255,255,255,0.08)'}`,
                background: active ? meta.bg : 'rgba(255,255,255,0.03)',
                color: active ? meta.color : 'rgba(255,255,255,0.4)',
                fontSize: '0.75rem', fontWeight: active ? 700 : 500,
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 0.8,
              }}>
                {f === 'All' ? '🔔' : getMeta(f).icon} {f === 'All' ? 'All' : getMeta(f).label}
                <Box sx={{ px: 0.7, borderRadius: '6px', background: 'rgba(255,255,255,0.06)', fontSize: '0.65rem', fontWeight: 700 }}>
                  {counts[f]}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* ── Search ── */}
        <Box sx={{ mb: 3 }}>
          <TextField
            placeholder="Search by title, message, email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 18 }} /></InputAdornment>,
            }}
            sx={{
              maxWidth: 480,
              '& .MuiInputBase-root': {
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', color: '#f1f5f9',
                '&:hover': { border: '1px solid rgba(99,179,237,0.35)' },
                '&.Mui-focused': { border: '1px solid #63b3ed', boxShadow: '0 0 0 3px rgba(99,179,237,0.1)' },
              },
              '& .MuiInputBase-input': { color: '#f1f5f9', py: 1.2, '&::placeholder': { color: 'rgba(255,255,255,0.3)', opacity: 1 } },
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
            }}
          />
        </Box>

        {/* ── Table ── */}
        <Box sx={{
          borderRadius: '20px', overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.035)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
          animation: 'cardIn 0.55s cubic-bezier(.22,1,.36,1) 0.1s both',
          '@keyframes cardIn': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'none' } },
        }}>
          {/* Table head */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 2.4fr 1.3fr 0.9fr 1fr 0.8fr' }}>
            <Col>Type</Col>
            <Col>Message</Col>
            <Col>Recipient</Col>
            <Col>Purpose</Col>
            <Col>Date & Time</Col>
            <Col>Status</Col>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
              <CircularProgress size={28} sx={{ color: '#63b3ed' }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>Loading notifications…</Typography>
            </Box>
          ) : paged.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Box sx={{ fontSize: '3rem', mb: 2 }}>🔔</Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>No notifications found</Typography>
            </Box>
          ) : (
            paged.map((n, idx) => {
              const meta = getMeta(n.notification_type);
              const ts = n.timestamp || n.created_at;
              return (
                <Box key={n._id || idx} sx={{
                  display: 'grid', gridTemplateColumns: '1.2fr 2.4fr 1.3fr 0.9fr 1fr 0.8fr',
                  transition: 'background 0.18s',
                  animation: `rowIn 0.4s ease ${idx * 0.03}s both`,
                  '@keyframes rowIn': { from: { opacity: 0, transform: 'translateX(-6px)' }, to: { opacity: 1, transform: 'none' } },
                  '&:hover': { background: 'rgba(99,179,237,0.04)' },
                }}>
                  {/* Type */}
                  <Cell>
                    <Box sx={{
                      display: 'inline-flex', alignItems: 'center', gap: 0.8,
                      px: 1.5, py: 0.5, borderRadius: '8px',
                      background: meta.bg, border: `1px solid ${meta.border}`,
                    }}>
                      <Box sx={{ fontSize: '0.9rem', lineHeight: 1 }}>{meta.icon}</Box>
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: meta.color, lineHeight: 1 }}>
                        {meta.label}
                      </Typography>
                    </Box>
                  </Cell>

                  {/* Message */}
                  <Cell>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.84rem', color: '#f1f5f9', mb: 0.3 }}>{n.title || '—'}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.38)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.message || '—'}
                    </Typography>
                  </Cell>

                  {/* Recipient */}
                  <Cell>
                    {(n.receiver_email || n.user_email || n.metadata?.receiver_email || n.metadata?.patient_email) ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Email sx={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }} />
                        <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {n.receiver_email || n.user_email || n.metadata?.receiver_email || n.metadata?.patient_email}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>—</Typography>
                    )}
                  </Cell>

                  {/* Purpose */}
                  <Cell>
                    <Typography sx={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.45)' }}>
                      {n.purpose || n.metadata?.purpose || n.notification_type?.replace(/_/g, ' ') || '—'}
                    </Typography>
                  </Cell>

                  {/* Timestamp */}
                  <Cell>
                    {ts ? (
                      <Tooltip title={dayjs(ts).format('YYYY-MM-DD HH:mm:ss')} arrow>
                        <Box>
                          <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' }}>
                            {dayjs(ts).format('MMM D, YYYY')}
                          </Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.28)' }}>
                            {dayjs(ts).format('HH:mm')}
                          </Typography>
                        </Box>
                      </Tooltip>
                    ) : <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>—</Typography>}
                  </Cell>

                  {/* Status */}
                  <Cell>
                    <Box sx={{
                      display: 'inline-flex', alignItems: 'center', gap: 0.6,
                      px: 1.2, py: 0.4, borderRadius: '7px',
                      background: n.status === 'sent' || n.status === 'Confirmed' ? 'rgba(52,211,153,0.1)' : n.status === 'failed' ? 'rgba(251,113,133,0.1)' : 'rgba(255,255,255,0.05)',
                      border: n.status === 'sent' || n.status === 'Confirmed' ? '1px solid rgba(52,211,153,0.25)' : n.status === 'failed' ? '1px solid rgba(251,113,133,0.25)' : '1px solid rgba(255,255,255,0.08)',
                    }}>
                      <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: n.status === 'sent' || n.status === 'Confirmed' ? '#34d399' : n.status === 'failed' ? '#fb7185' : '#fbbf24' }} />
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: n.status === 'sent' || n.status === 'Confirmed' ? '#34d399' : n.status === 'failed' ? '#fb7185' : '#fbbf24' }}>
                        {n.status || 'sent'}
                      </Typography>
                    </Box>
                  </Cell>
                </Box>
              );
            })
          )}
        </Box>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Box key={p} onClick={() => setPage(p)} sx={{
                width: 36, height: 36, borderRadius: '10px', display: 'grid', placeItems: 'center',
                cursor: 'pointer', fontWeight: p === page ? 700 : 500, fontSize: '0.82rem',
                background: p === page ? 'rgba(99,179,237,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${p === page ? 'rgba(99,179,237,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: p === page ? '#63b3ed' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.2s',
                '&:hover': { background: 'rgba(99,179,237,0.12)', color: '#63b3ed' },
              }}>{p}</Box>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}
