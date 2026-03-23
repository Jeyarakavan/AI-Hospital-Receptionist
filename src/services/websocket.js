const DEFAULT_WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://127.0.0.1:8000';

function buildWsUrl(token) {
  const base = DEFAULT_WS_BASE_URL.replace(/\/$/, '');
  const query = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${base}/ws/calls/${query}`;
}

export function createLiveCallsSocket({ token, onMessage, onOpen, onClose, onError }) {
  const url = buildWsUrl(token);
  const socket = new WebSocket(url);

  socket.onopen = () => {
    if (onOpen) onOpen();
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (onMessage) onMessage(data);
    } catch (error) {
      console.error('Invalid websocket payload', error);
    }
  };

  socket.onerror = (error) => {
    if (onError) onError(error);
  };

  socket.onclose = () => {
    if (onClose) onClose();
  };

  return socket;
}
