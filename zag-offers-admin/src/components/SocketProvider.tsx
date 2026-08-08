'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/shared/Toast';

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online/api').replace(/\/api$/, '');

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, isConnected: false });

export function useSocketContext() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1];
    const userStr = localStorage.getItem('admin_user');
    if (!token || !userStr) return;
    let active = true;
    let newSocket: Socket | null = null;
    let userId = '';
    try { userId = JSON.parse(userStr).id || ''; } catch { return; }
    if (!userId) return;

    void import('socket.io-client').then(({ io }) => {
      if (!active) return;
      newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        newSocket?.emit('join_room', { token, room: 'admin_room' });
      });

      newSocket.on('disconnect', () => setIsConnected(false));

      newSocket.on('admin_notification', (notification: { type: string; body?: string }) => {
        if (notification.type === 'ANNOUNCEMENT' && notification.body) showToast(notification.body, 'info');
        if (notification.type === 'NEW_PENDING_OFFER') {
          void queryClient.invalidateQueries({ queryKey: ['all-offers'] });
          void queryClient.invalidateQueries({ queryKey: ['pending-offers'] });
        } else if (notification.type === 'NEW_PENDING_STORE' || notification.type === 'SYSTEM') {
          void queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
          if (notification.type === 'NEW_PENDING_STORE') void queryClient.invalidateQueries({ queryKey: ['pending-stores'] });
        }
        void queryClient.invalidateQueries({ queryKey: ['pending-count'] });
        void queryClient.invalidateQueries({ queryKey: ['global-stats'] });
      });

      setSocket(newSocket);
    });

    return () => {
      active = false;
      newSocket?.off('admin_notification');
      newSocket?.disconnect();
    };
  }, [queryClient, showToast]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
