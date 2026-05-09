import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online';
const RECONNECT_INTERVAL = 5000; // 5 seconds
const MAX_RECONNECT_ATTEMPTS = 10;

export const useSocket = (token?: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!token) {
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connecting');
    reconnectAttempts.current = 0;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: RECONNECT_INTERVAL,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    });

    newSocket.on('connect', () => {
      console.log('Client Socket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;
      newSocket.emit('join_room', { token });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Client Socket disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Client Socket connection error:', error);
      setIsConnected(false);
      setConnectionStatus('error');
      reconnectAttempts.current++;

      if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        console.warn('Max reconnection attempts reached');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      }
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
      setConnectionStatus('connecting');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;
    });

    newSocket.on('reconnect_failed', () => {
      console.log('Reconnection failed');
      setIsConnected(false);
      setConnectionStatus('error');
    });

    setSocket(newSocket);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      newSocket.disconnect();
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [token]);

  return { socket, isConnected, connectionStatus };
};
