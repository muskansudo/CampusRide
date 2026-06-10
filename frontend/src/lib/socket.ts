import { io, type Socket } from 'socket.io-client';
import { useNetworkStore, type SocketStatus } from '@/store/networkStore';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');

let socket: Socket | null = null;

function setSocketStatus(status: SocketStatus) {
  const store = useNetworkStore.getState();
  const prev = store.socketStatus;
  store.setSocketStatus(status);
  if (prev !== 'connected' && status === 'connected' && store.isOnline) {
    store.flashReconnected();
  }
}

function attachSocketListeners(s: Socket) {
  s.on('connect', () => setSocketStatus('connected'));
  s.on('disconnect', () => setSocketStatus('disconnected'));
  s.io.on('reconnect_attempt', () => setSocketStatus('reconnecting'));
  s.io.on('reconnect', () => setSocketStatus('connected'));
  s.io.on('reconnect_failed', () => setSocketStatus('disconnected'));
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  if (socket) {
    socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  attachSocketListeners(socket);
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    setSocketStatus('disconnected');
  }
}

export function getSocket(): Socket | null {
  return socket;
}
