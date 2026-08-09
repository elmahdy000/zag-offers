import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { getVendorSessionToken } from '@/lib/api';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');

  useEffect(() => {
    let active = true;
    let newSocket: Socket | null = null;
    // Avoid opening a transport for transient React mounts. Starting with
    // polling lets Engine.IO complete reliably before upgrading to WebSocket.
    const connectTimer = window.setTimeout(() => {
      void import('socket.io-client').then(({ io }) => {
        if (!active) return;
        const token = getVendorSessionToken();
        newSocket = io(SOCKET_URL, {
          auth: token ? { token } : undefined,
          withCredentials: true,
          transports: ['polling', 'websocket'],
          upgrade: true,
          reconnection: true,
          reconnectionDelay: 1500,
          reconnectionDelayMax: 10000,
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
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(connectTimer);
      newSocket?.close();
    };
  }, []);

  return { socket, connectionStatus };
};
