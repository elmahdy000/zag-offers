import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      setSocket(newSocket);
      setConnectionStatus('connected');
      console.log('Vendor Socket Connected');
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
  }, []);

  return { socket, connectionStatus };
};
