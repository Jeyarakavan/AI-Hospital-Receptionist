import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createLiveCallsSocket } from '../services/websocket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [activeCalls, setActiveCalls] = useState([]);
  const [humanQueue, setHumanQueue] = useState([]);
  const [emergencyAlert, setEmergencyAlert] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const retryRef = useRef(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 5;

  useEffect(() => {
    if (!isAuthenticated) {
      setConnected(false);
      setActiveCalls([]);
      setHumanQueue([]);
      setEmergencyAlert(null);
      if (socketRef.current) socketRef.current.close();
      socketRef.current = null;
      retryCountRef.current = 0;
      return;
    }

    let cancelled = false;

    const connect = () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      if (retryCountRef.current >= MAX_RETRIES) {
        console.warn('WebSocket: max retries reached, giving up.');
        return;
      }

      const socket = createLiveCallsSocket({
        token,
        onOpen: () => {
          retryCountRef.current = 0;
          setConnected(true);
        },
        onClose: () => {
          setConnected(false);
          if (!cancelled && retryCountRef.current < MAX_RETRIES) {
            const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
            retryCountRef.current += 1;
            retryRef.current = setTimeout(connect, delay);
          }
        },
        onMessage: (msg) => {
          const payload = msg.payload || {};

          if (msg.event === 'call_started') {
            setActiveCalls((prev) => [payload, ...prev.filter((c) => c.call_sid !== payload.call_sid)]);
            return;
          }

          if (msg.event === 'call_queued') {
            setHumanQueue((prev) => [payload, ...prev.filter((c) => c.call_sid !== payload.call_sid)]);
            if (payload.queue === 'emergency') {
              setEmergencyAlert(payload);
            }
            return;
          }

          if (msg.event === 'call_ended') {
            setActiveCalls((prev) => prev.filter((c) => c.call_sid !== payload.call_sid));
            setHumanQueue((prev) => prev.filter((c) => c.call_sid !== payload.call_sid));
            setEmergencyAlert((prev) => (prev?.call_sid === payload.call_sid ? null : prev));
          }
        },
        onError: (err) => {
          console.error('WebSocket error', err);
        },
      });

      socketRef.current = socket;
    };

    connect();

    return () => {
      cancelled = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      if (socketRef.current) socketRef.current.close();
      socketRef.current = null;
      retryCountRef.current = 0;
    };
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      connected,
      activeCalls,
      humanQueue,
      emergencyAlert,
      dismissEmergency: () => setEmergencyAlert(null),
    }),
    [connected, activeCalls, humanQueue, emergencyAlert]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket must be used inside SocketProvider');
  }
  return ctx;
}
