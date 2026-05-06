import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getCookie } from '@/lib/api';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online';

/**
 * Hook للاتصال بالـ WebSocket وضم المستخدم لغرفته.
 * يرسل التوكن تلقائياً مع join_room كما يتوقع الباك-إيند.
 *
 * @param userId - معرف المستخدم (userId). لو null أو undefined، لن يتم الانضمام لأي غرفة.
 */
export const useSocket = (userId?: string) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = getCookie('auth_token');
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      console.log('Connected to Real-time Server');
      if (userId && token) {
        // الباك-إيند يتوقع object: { token, userId }
        socketRef.current?.emit('join_room', { token, userId });
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [userId]);

  return socketRef;
};
