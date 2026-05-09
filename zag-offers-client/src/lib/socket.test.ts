import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSocket } from './socket';
import { io } from 'socket.io-client';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(),
}));

describe('useSocket', () => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (io as any).mockReturnValue(mockSocket);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not connect when token is null', () => {
    const { result } = renderHook(() => useSocket(null));
    
    expect(io).not.toHaveBeenCalled();
    expect(result.current.socket).toBeNull();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionStatus).toBe('disconnected');
  });

  it('should connect when token is provided', () => {
    const token = 'test-token';
    renderHook(() => useSocket(token));
    
    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 5000,
        reconnectionAttempts: 10,
      })
    );
  });

  it('should set connection status to connected on connect event', async () => {
    const token = 'test-token';
    
    mockSocket.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'connect') {
        callback();
      }
    });

    const { result } = renderHook(() => useSocket(token));
    
    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('connected');
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should set connection status to error on connect_error event', async () => {
    const token = 'test-token';
    
    mockSocket.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'connect_error') {
        callback(new Error('Connection failed'));
      }
    });

    const { result } = renderHook(() => useSocket(token));
    
    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('error');
      expect(result.current.isConnected).toBe(false);
    });
  });

  it('should set connection status to disconnected on disconnect event', async () => {
    const token = 'test-token';
    
    mockSocket.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'connect') {
        callback();
      }
      if (event === 'disconnect') {
        callback('transport close');
      }
    });

    const { result } = renderHook(() => useSocket(token));
    
    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('disconnected');
      expect(result.current.isConnected).toBe(false);
    });
  });

  it('should join room on connect', async () => {
    const token = 'test-token';
    
    mockSocket.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'connect') {
        callback();
      }
    });

    renderHook(() => useSocket(token));
    
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('join_room', { token });
    });
  });

  it('should disconnect on unmount', () => {
    const token = 'test-token';
    const { unmount } = renderHook(() => useSocket(token));
    
    unmount();
    
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
