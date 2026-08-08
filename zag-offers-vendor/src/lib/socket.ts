import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');

  useEffect(() => {
    let active = true;
    let newSocket: Socket | null = null;
    void import('socket.io-client').then(({ io }) => {
      if (!active) return;
      newSocket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
      });

      newSocket.on('connect', () => {
        setSocket(newSocket);
        setConnectionStatus('connected');
      });

      newSocket.on('disconnect', () => {
        setSocket(null);
        setConnectionStatus('disconnected');
      });

      newSocket.on('connect_error', () => setConnectionStatus('error'));
    });

    return () => {
      active = false;
      newSocket?.close();
    };
  }, []);

  return { socket, connectionStatus };
};
