import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online';

export const useSocket = (token: string | null, userId: string | null, role: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!token || !userId) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      newSocket.emit('join_room', { token });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, userId]);

  return socket;
};
