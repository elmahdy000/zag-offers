import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { API_URL } from '@/lib/constants';

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Custom hook for favorites
const useFavorites = () => {
  const [favorites, setFavorites] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchFavorites = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      const saved = localStorage.getItem('favorites');
      if (saved) setFavorites(JSON.parse(saved));
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const offers = data.map((fav: any) => ({
          ...fav.offer,
          store: fav.offer.store
        }));
        setFavorites(offers);
      }
    } catch (e) {
      // Fallback to localStorage
      const saved = localStorage.getItem('favorites');
      if (saved) setFavorites(JSON.parse(saved));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (offerId: string) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        const res = await fetch(`${API_URL}/favorites/toggle/${offerId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          await fetchFavorites();
          return true;
        }
      } catch { /* silent */ }
    }
    
    // Fallback to localStorage
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    const exists = favs.some((f: any) => f.id === offerId);
    const updated = exists 
      ? favs.filter((f: any) => f.id !== offerId)
      : [...favs, { id: offerId }];
    localStorage.setItem('favorites', JSON.stringify(updated));
    setFavorites(updated);
    return !exists;
  };

  React.useEffect(() => {
    fetchFavorites();
  }, []);

  return { favorites, isLoading, toggleFavorite, refetch: fetchFavorites };
};

describe('useFavorites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load favorites from localStorage when not logged in', async () => {
    const mockFavorites = [{ id: '1', title: 'Test Offer' }];
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'favorites') return JSON.stringify(mockFavorites);
      return null;
    });

    const { result } = renderHook(() => useFavorites());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.favorites).toEqual(mockFavorites);
    });
  });

  it('should load favorites from API when logged in', async () => {
    const token = 'test-token';
    const mockApiFavorites = [
      { offerId: '1', offer: { id: '1', title: 'API Offer', store: { name: 'Store' } } }
    ];
    
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'token') return token;
      return null;
    });

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiFavorites,
    });

    const { result } = renderHook(() => useFavorites());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.favorites).toHaveLength(1);
      expect(result.current.favorites[0].title).toBe('API Offer');
    });

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/favorites`,
      expect.objectContaining({
        headers: { Authorization: `Bearer ${token}` }
      })
    );
  });

  it('should toggle favorite via API when logged in', async () => {
    const token = 'test-token';
    
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'token') return token;
      return null;
    });

    (fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // Initial fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ favorited: true }) }); // Toggle

    const { result } = renderHook(() => useFavorites());
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.toggleFavorite('1');
    });

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/favorites/toggle/1`,
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
    );
  });

  it('should toggle favorite in localStorage when not logged in', async () => {
    const { result } = renderHook(() => useFavorites());
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.toggleFavorite('1');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'favorites',
      JSON.stringify([{ id: '1' }])
    );
  });

  it('should remove favorite from localStorage when already exists', async () => {
    const existingFavorites = [{ id: '1', title: 'Existing' }];
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'favorites') return JSON.stringify(existingFavorites);
      return null;
    });

    const { result } = renderHook(() => useFavorites());
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.toggleFavorite('1');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'favorites',
      JSON.stringify([])
    );
  });

  it('should fallback to localStorage on API error', async () => {
    const token = 'test-token';
    const mockLocalFavorites = [{ id: '1', title: 'Local Fallback' }];
    
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'token') return token;
      if (key === 'favorites') return JSON.stringify(mockLocalFavorites);
      return null;
    });

    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useFavorites());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.favorites).toEqual(mockLocalFavorites);
    });
  });
});
