/**
 * Chat / Messages Page - Enhanced UI
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  IconButton,
  Avatar,
} from '@mui/material';
import { DeleteOutline, Send, Search } from '@mui/icons-material';
import { chatAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

/* ─── Scroll helper ─── */
const useScrollBottom = (dep) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [dep]);
  return ref;
};

/* ─── Gradient avatar ─── */
const GRADIENTS = [
  'linear-gradient(135deg,#38bdf8,#818cf8)',
  'linear-gradient(135deg,#34d399,#0d9488)',
  'linear-gradient(135deg,#fbbf24,#f59e0b)',
  'linear-gradient(135deg,#fb7185,#e11d48)',
  'linear-gradient(135deg,#a78bfa,#7c3aed)',
];
const avatarGrad = (id) => GRADIENTS[(id || 0) % GRADIENTS.length];

const GradAvatar = ({ user: u, size = 38 }) => (
  u?.profile_picture_url
    ? <Avatar src={u.profile_picture_url} sx={{ width: size, height: size }} />
    : <Box sx={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: avatarGrad(u?.id),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 800, color: '#fff',
      }}>
        {(u?.full_name?.[0] || u?.email?.[0] || 'U').toUpperCase()}
      </Box>
);

/* ─── Typing dots ─── */
const TypingDots = () => (
  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', px: 2, py: 1.5 }}>
    {[0,1,2].map(i => (
      <Box key={i} sx={{
        width: 6, height: 6, borderRadius: '50%', background: '#63b3ed',
        animation: 'bounce 1.2s ease-in-out infinite',
        animationDelay: `${i * 0.2}s`,
        '@keyframes bounce': { '0%,80%,100%': { transform: 'scale(0.7)', opacity: 0.4 }, '40%': { transform: 'scale(1)', opacity: 1 } },
      }} />
    ))}
  </Box>
);

/* ─── Empty chat illustration ─── */
const EmptyChat = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2, opacity: 0.6 }}>
    <Box sx={{
      width: 72, height: 72, borderRadius: '20px',
      background: 'linear-gradient(135deg,rgba(56,189,248,0.15),rgba(129,140,248,0.15))',
      border: '1px solid rgba(99,179,237,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
    }}>💬</Box>
    <Box sx={{ textAlign: 'center' }}>
      <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>No messages yet</Typography>
      <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', mt: 0.4 }}>Say hello to start the conversation</Typography>
    </Box>
  </Box>
);

export default function Chat() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const messagesRef = useScrollBottom(messages);

  const loadUsers = async (query) => {
    setLoadingUsers(true);
    try {
      const res = await chatAPI.searchUsers(query);
      setUsers(res.data || []);
    } catch { setUsers([]); }
    finally { setLoadingUsers(false); }
  };

  const loadMessages = async (otherUser) => {
    if (!otherUser) return;
    setLoadingMessages(true);
    try {
      const res = await chatAPI.getMessages(otherUser.id);
      const data = res.data;
      setMessages(Array.isArray(data) ? data : data?.results || []);
    } catch { setMessages([]); }
    finally { setLoadingMessages(false); }
  };

  useEffect(() => { loadUsers(''); }, []);
  useEffect(() => { if (selectedUser) loadMessages(selectedUser); }, [selectedUser?.id]);

  const handleSend = async () => {
    if (!selectedUser || !newMessage.trim()) return;
    setSending(true);
    try {
      await chatAPI.sendMessage(selectedUser.id, newMessage.trim());
      setNewMessage('');
      loadMessages(selectedUser);
    } finally { setSending(false); }
  };

  const handleDelete = async (msg) => {
    if (!window.confirm('Delete this message?')) return;
    setDeletingId(msg.id);
    try {
      await chatAPI.deleteMessage(msg.id);
      setMessages(prev => prev.filter(m => m.id !== msg.id));
    } catch {} finally { setDeletingId(null); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <Box sx={{
      minHeight: 'calc(100vh - 96px)',
      background: 'linear-gradient(135deg,#0a0f1e 0%,#0d1f3c 50%,#071422 100%)',
      fontFamily: "'Sora','Nunito',sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Orbs */}
      <Box sx={{ position: 'absolute', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,189,248,0.06) 0%,transparent 70%)', top: '-15%', right: '-8%', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle,rgba(129,140,248,0.05) 0%,transparent 70%)', bottom: '-10%', left: '-6%', pointerEvents: 'none' }} />

      <Container maxWidth="xl" sx={{ py: 5, position: 'relative', zIndex: 1, height: 'calc(100vh - 96px)', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3,
          animation: 'fadeDown 0.45s ease both',
          '@keyframes fadeDown': { from: { opacity: 0, transform: 'translateY(-12px)' }, to: { opacity: 1, transform: 'none' } },
        }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg,#38bdf8,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '1.1rem' }}>💬</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>Messages</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>{users.length} contacts available</Typography>
          </Box>
        </Box>

        {/* ── Main panel ── */}
        <Box sx={{
          flex: 1, display: 'flex', overflow: 'hidden',
          borderRadius: '22px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.032)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
          animation: 'cardIn 0.55s cubic-bezier(.22,1,.36,1) 0.1s both',
          '@keyframes cardIn': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'none' } },
        }}>

          {/* ══ Sidebar ══ */}
          <Box sx={{
            width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column',
            borderRight: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(0,0,0,0.15)',
          }}>
            {/* Search */}
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Box sx={{ position: 'relative' }}>
                <Search sx={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 17, color: 'rgba(255,255,255,0.3)' }} />
                <Box component="input"
                  placeholder="Search people…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); loadUsers(e.target.value); }}
                  sx={{
                    width: '100%', pl: '34px', pr: 1.5, py: 1.1,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', color: '#f1f5f9',
                    fontSize: '0.835rem', fontFamily: 'inherit', outline: 'none',
                    transition: 'border 0.2s',
                    '&::placeholder': { color: 'rgba(255,255,255,0.3)' },
                    '&:focus': { border: '1px solid rgba(99,179,237,0.5)' },
                    boxSizing: 'border-box',
                  }}
                />
              </Box>
            </Box>

            {/* User list */}
            <Box sx={{ flex: 1, overflowY: 'auto',
              '&::-webkit-scrollbar': { width: 3 },
              '&::-webkit-scrollbar-thumb': { background: 'rgba(99,179,237,0.2)', borderRadius: 2 },
            }}>
              {loadingUsers ? (
                <Box sx={{ p: 3 }}>
                  {[...Array(5)].map((_, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center' }}>
                      <Box sx={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', flexShrink: 0,
                        animation: 'shimmer 1.4s infinite', '@keyframes shimmer': { '0%,100%': { opacity: 0.4 }, '50%': { opacity: 0.8 } } }} />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.06)', mb: 1, width: '65%' }} />
                        <Box sx={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.04)', width: '40%' }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : users.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', mt: 4 }}>
                  <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>🔍</Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>No users found</Typography>
                </Box>
              ) : (
                users.map((u, idx) => {
                  const active = selectedUser?.id === u.id;
                  return (
                    <Box key={u.id} onClick={() => setSelectedUser(u)} sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      px: 2, py: 1.4, cursor: 'pointer',
                      borderLeft: `3px solid ${active ? '#63b3ed' : 'transparent'}`,
                      background: active ? 'rgba(99,179,237,0.1)' : 'transparent',
                      transition: 'all 0.18s',
                      animation: `userIn 0.35s ease ${idx * 0.03}s both`,
                      '@keyframes userIn': { from: { opacity: 0, transform: 'translateX(-8px)' }, to: { opacity: 1, transform: 'none' } },
                      '&:hover': { background: active ? 'rgba(99,179,237,0.1)' : 'rgba(255,255,255,0.04)' },
                    }}>
                      <GradAvatar user={u} size={38} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: active ? 700 : 500, color: active ? '#63b3ed' : '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.full_name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.32)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.email}
                        </Typography>
                      </Box>
                      {active && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#38bdf8', flexShrink: 0, boxShadow: '0 0 6px #38bdf8' }} />}
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>

          {/* ══ Chat area ══ */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Chat header */}
            <Box sx={{
              px: 3, py: 1.8,
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(0,0,0,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 64,
            }}>
              {selectedUser ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ position: 'relative' }}>
                    <GradAvatar user={selectedUser} size={40} />
                    <Box sx={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', bgcolor: '#34d399', border: '2px solid #0d1f3c' }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>{selectedUser.full_name}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 500 }}>● Online</Typography>
                  </Box>
                </Box>
              ) : (
                <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                  Select a conversation to start chatting
                </Typography>
              )}
            </Box>

            {/* Messages */}
            <Box ref={messagesRef} sx={{
              flex: 1, overflowY: 'auto', px: 3, py: 2.5,
              display: 'flex', flexDirection: 'column', gap: 1,
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': { background: 'rgba(99,179,237,0.2)', borderRadius: 2 },
            }}>
              {!selectedUser ? null
                : loadingMessages ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    {[70, 50, 80, 55].map((w, i) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end' }}>
                        <Box sx={{ width: `${w}%`, height: 44, borderRadius: '14px', background: 'rgba(255,255,255,0.05)',
                          animation: 'shimmer 1.4s ease infinite', '@keyframes shimmer': { '0%,100%': { opacity: 0.4 }, '50%': { opacity: 0.8 } } }} />
                      </Box>
                    ))}
                  </Box>
                ) : messages.length === 0 ? <EmptyChat />
                : messages.map((msg, idx) => {
                  const isMe = msg.sender?.id === user?.id;
                  const showAvatar = !isMe && (idx === 0 || messages[idx - 1]?.sender?.id !== msg.sender?.id);
                  return (
                    <Box key={msg.id} sx={{
                      display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
                      alignItems: 'flex-end', gap: 1,
                      animation: `msgIn 0.3s ease ${Math.min(idx * 0.02, 0.3)}s both`,
                      '@keyframes msgIn': { from: { opacity: 0, transform: `translateY(8px) translateX(${isMe ? 8 : -8}px)` }, to: { opacity: 1, transform: 'none' } },
                    }}>
                      {/* Left avatar placeholder for alignment */}
                      {!isMe && (
                        <Box sx={{ width: 28, flexShrink: 0 }}>
                          {showAvatar && <GradAvatar user={msg.sender} size={28} />}
                        </Box>
                      )}

                      <Box sx={{
                        maxWidth: '62%',
                        background: isMe
                          ? 'linear-gradient(135deg,#38bdf8,#818cf8)'
                          : 'rgba(255,255,255,0.07)',
                        border: isMe ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        px: 2, py: 1.2,
                        position: 'relative',
                        boxShadow: isMe ? '0 4px 16px rgba(56,189,248,0.25)' : 'none',
                        display: 'flex', alignItems: 'flex-end', gap: 1,
                      }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: '0.86rem', color: isMe ? '#fff' : '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5 }}>
                            {msg.message}
                          </Typography>
                          <Typography sx={{ fontSize: '0.65rem', color: isMe ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)', mt: 0.4, display: 'block' }}>
                            {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                        {isMe && (
                          <IconButton size="small" onClick={() => handleDelete(msg)} disabled={deletingId === msg.id}
                            sx={{ color: 'rgba(255,255,255,0.5)', p: 0.3, opacity: 0, transition: 'opacity 0.2s', flexShrink: 0,
                              '.MuiBox-root:hover &': { opacity: 1 },
                              '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.15)' },
                            }}>
                            <DeleteOutline sx={{ fontSize: 14 }} />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  );
                })
              }
            </Box>

            {/* Input bar */}
            <Box sx={{
              px: 2.5, py: 2,
              borderTop: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(0,0,0,0.1)',
              display: 'flex', gap: 1.5, alignItems: 'flex-end',
            }}>
              <Box sx={{
                flex: 1,
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${newMessage ? 'rgba(99,179,237,0.45)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '14px',
                transition: 'border 0.2s',
                overflow: 'hidden',
              }}>
                <Box component="textarea"
                  placeholder={selectedUser ? 'Type a message… (Enter to send)' : 'Select a user to start chatting'}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!selectedUser}
                  rows={1}
                  sx={{
                    width: '100%', px: 2, py: 1.3, background: 'transparent',
                    border: 'none', outline: 'none', resize: 'none',
                    color: '#f1f5f9', fontFamily: 'inherit', fontSize: '0.875rem',
                    lineHeight: 1.6, boxSizing: 'border-box',
                    '&::placeholder': { color: 'rgba(255,255,255,0.28)' },
                    '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
                  }}
                />
              </Box>
              <Box onClick={!selectedUser || !newMessage.trim() || sending ? undefined : handleSend}
                sx={{
                  width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                  background: (!selectedUser || !newMessage.trim() || sending)
                    ? 'rgba(99,179,237,0.15)'
                    : 'linear-gradient(135deg,#38bdf8,#818cf8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: (!selectedUser || !newMessage.trim() || sending) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.22s',
                  boxShadow: (!selectedUser || !newMessage.trim() || sending) ? 'none' : '0 4px 16px rgba(56,189,248,0.35)',
                  '&:hover': (!selectedUser || !newMessage.trim() || sending) ? {} : { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(56,189,248,0.45)' },
                }}>
                {sending
                  ? <Box sx={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }} />
                  : <Send sx={{ fontSize: 18, color: (!selectedUser || !newMessage.trim()) ? 'rgba(255,255,255,0.3)' : '#fff' }} />
                }
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}