import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { API_URL } from '@/lib/constants';

// Mock fetch
global.fetch = vi.fn();

const fetchMock = vi.mocked(fetch);
/** Minimal `Response` stub — only `ok` and `json()` are consumed by the hook. */
const jsonResponse = (body: unknown): Response =>
  ({ ok: true, json: async () => body }) as unknown as Response;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

/** Minimal shape used by this local hook fixture. */
interface FavoriteItem {
  id: string;
  title?: string;
  store?: { name: string };
}

/** API favourite envelope returned by `/favorites`. */
interface ApiFavorite {
  offerId: string;
  offer: FavoriteItem;
}

// Custom hook for favorites (inline fixture mirroring the production hook)
const useFavorites = () => {
  const [favorites, setFavorites] = React.useState<FavoriteItem[]>([]);
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
        const data: ApiFavorite[] = await res.json();
        const offers = data.map((fav) => ({
          ...fav.offer,
          store: fav.offer.store
        }));
        setFavorites(offers);
      }
    } catch {
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
    const favs: FavoriteItem[] = JSON.parse(localStorage.getItem('favorites') || '[]');
    const exists = favs.some((f) => f.id === offerId);
    const updated = exists 
      ? favs.filter((f) => f.id !== offerId)
      : [...favs, { id: offerId }];
    localStorage.setItem('favorites', JSON.stringify(updated));
    setFavorites(updated);
    return !exists;
  };

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- test fixture mimics the production fetch-on-mount hook
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

    fetchMock.mockResolvedValueOnce(jsonResponse(mockApiFavorites));

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

    fetchMock
      .mockResolvedValueOnce(jsonResponse([])) // Initial fetch
      .mockResolvedValueOnce(jsonResponse({ favorited: true })); // Toggle

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

    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useFavorites());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.favorites).toEqual(mockLocalFavorites);
    });
  });
});
