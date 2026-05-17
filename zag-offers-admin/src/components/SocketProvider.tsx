'use client';

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

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
  const [authData, setAuthData] = useState<{ token: string; userId: string } | null>(null);
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1];
    const userStr = localStorage.getItem('admin_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setAuthData({ token, userId: user.id });
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (!authData?.token || !authData?.userId) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token: authData.token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join_room', { token: authData.token });
    });

    newSocket.on('disconnect', () => setIsConnected(false));

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [authData?.token, authData?.userId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
