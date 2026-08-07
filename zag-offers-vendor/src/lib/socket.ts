import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getCookie } from './api';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online';

export const useSocket = (token?: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  useEffect(() => {
    const activeToken = token || getCookie('auth_token');
    if (!activeToken) {
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token: activeToken },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      setSocket(newSocket);
      setConnectionStatus('connected');
      console.log('Vendor Socket Connected');
      newSocket.emit('join_room', { token: activeToken });
    });

    newSocket.on('disconnect', () => {
      setSocket(null);
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', () => {
      setConnectionStatus('error');
    });

    return () => {
      newSocket.close();
    };
  }, [token]);

  return { socket, connectionStatus };
};
