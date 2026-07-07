import { io } from 'socket.io-client';
import cookies from 'js-cookie';

const API_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000/api';
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

let socket = null;

export function connectSocket() {
  if (socket?.connected) return socket;

  const token = cookies.get('jwt-auth', { path: '/' });
  if (!token) return null;

  socket = io(SOCKET_URL, {
    auth: { token },
    withCredentials: true,
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket() {
  return socket;
}
