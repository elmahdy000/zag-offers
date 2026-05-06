import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useSocket = (token?: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Client Socket connected:', newSocket.id);
      if (token) {
        newSocket.emit('join_room', { token });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  return socket;
};
