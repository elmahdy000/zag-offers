/**
 * Favorites store — single source of truth for the current session.
 *
 * Anonymous users:  stored in localStorage as an array of Offer objects.
 * Logged-in users:  server is authoritative; localStorage is a cache
 *                   used to render the initial UI without waiting for the API.
 *
 * The store exposes:
 *   - `subscribeFavorites(fn)` → cross-component reactivity (event bus).
 *   - `useFavoriteIds()`       → React hook returning a Set of favorited IDs.
 *   - `toggleFavorite(offer)`  → optimistic toggle, calls the API when logged in.
 */
import { apiClient } from './api-client';

const KEY = 'favorites';
const GUEST_KEY = 'guest_favorites';
const EVENT = 'zag:favorites-changed';

type FavoriteRecord = {
  id: string;
  title?: string;
  discount?: string;
  images?: string[];
  endDate?: string;
  store?: { id?: string; name?: string; logo?: string; area?: string };
};

function safeParse(raw: string | null): FavoriteRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is FavoriteRecord => !!x && typeof x === 'object' && 'id' in x) : [];
  } catch {
    return [];
  }
}

function read(): FavoriteRecord[] {
  if (typeof window === 'undefined') return [];
  const key = window.localStorage.getItem('user') ? KEY : GUEST_KEY;
  return safeParse(window.localStorage.getItem(key));
}

let listCache: FavoriteRecord[] | null = null;
let idCache: Set<string> | null = null;

function write(next: FavoriteRecord[], key?: string) {
  if (typeof window === 'undefined') return;
  const targetKey = key ?? (window.localStorage.getItem('user') ? KEY : GUEST_KEY);
  window.localStorage.setItem(targetKey, JSON.stringify(next));
  listCache = null;
  idCache = null;
  window.dispatchEvent(new Event(EVENT));
}

export function clearFavoriteCache() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
  listCache = null;
  idCache = null;
  window.dispatchEvent(new Event(EVENT));
}

export function isFavorited(id: string): boolean {
  return read().some((f) => f.id === id);
}

export async function toggleFavorite(offer: FavoriteRecord): Promise<boolean> {
  const current = read();
  const already = current.some((f) => f.id === offer.id);
  const next = already ? current.filter((f) => f.id !== offer.id) : [...current, offer];
  write(next);

  const isLoggedIn = typeof window !== 'undefined' && !!window.localStorage.getItem('user');
  if (isLoggedIn) {
    try {
      const res = await apiClient.post<{ favorited: boolean }>(`/favorites/toggle/${offer.id}`);
      if (res.favorited !== !already) {
        // Server disagreed — reconcile.
        const reconciled = res.favorited
          ? [...current.filter((f) => f.id !== offer.id), offer]
          : current.filter((f) => f.id !== offer.id);
        write(reconciled);
      }
      return res.favorited;
    } catch {
      // Roll back the optimistic update.
      write(current);
      return already;
    }
  }
  return !already;
}

// ─── React integration ─────────────────────────────────────────────────
import { useEffect, useSyncExternalStore } from 'react';

const subscribe = (fn: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const notify = () => {
    listCache = null;
    idCache = null;
    fn();
  };
  window.addEventListener(EVENT, notify);
  // Cross-tab sync — the storage event fires in other tabs when localStorage changes.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === GUEST_KEY || e.key === 'user') notify();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, notify);
    window.removeEventListener('storage', onStorage);
  };
};

const EMPTY_IDS = new Set<string>();
const getSnapshot = (): Set<string> => {
  if (idCache === null) idCache = new Set(read().map((f) => f.id));
  return idCache;
};
const getServerSnapshot = (): Set<string> => EMPTY_IDS;

/**
 * Reactive Set of favorited offer IDs — updates every card at once when the
 * user toggles a favorite anywhere on the page or in another tab.
 */
export function useFavoriteIds(): Set<string> {
  // useSyncExternalStore reads the store during render — cheap when the Set
  // reference stays stable (we return a fresh Set on each change, so React
  // uses referential inequality to notify subscribers).
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Cache the array snapshot so useSyncExternalStore doesn't tear on repeated
// reads within the same store version — we invalidate the cache on every
// EVENT/storage change via `subscribe`.
const subscribeList = (fn: () => void) => {
  const unsub = subscribe(() => {
    listCache = null;
    idCache = null;
    fn();
  });
  return unsub;
};
const getListSnapshot = (): FavoriteRecord[] => {
  if (listCache === null) listCache = read();
  return listCache;
};
const EMPTY_LIST: FavoriteRecord[] = [];
const getListServerSnapshot = (): FavoriteRecord[] => EMPTY_LIST;

/**
 * Reactive array of the full FavoriteRecord objects — used by pages that need
 * to render the favorited items themselves (not just check membership).
 */
export function useFavoriteList(): FavoriteRecord[] {
  return useSyncExternalStore(subscribeList, getListSnapshot, getListServerSnapshot);
}

export type { FavoriteRecord };

/**
 * One-shot bootstrap: pull the server-side favorite list into localStorage
 * once the user session is available. Call from a top-level provider.
 */
export function useFavoritesSync(isLoggedIn: boolean) {
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    apiClient
      .get<Array<FavoriteRecord & { offerId?: string; offer?: FavoriteRecord }>>('/favorites')
      .then(async (serverRows) => {
        if (cancelled || !Array.isArray(serverRows)) return;
        const serverFavs = serverRows
          .map((row) => row.offer ?? (row.offerId ? { ...row, id: row.offerId } : row))
          .filter((offer): offer is FavoriteRecord => !!offer?.id);

        const guestFavs = safeParse(window.localStorage.getItem(GUEST_KEY));
        const serverIds = new Set(serverFavs.map((favorite) => favorite.id));
        const missing = guestFavs.filter((favorite) => !serverIds.has(favorite.id));
        const migrated = [...serverFavs];
        const migratedIds = new Set(serverIds);

        for (const favorite of missing) {
          try {
            const result = await apiClient.post<{ favorited: boolean }>(`/favorites/toggle/${favorite.id}`);
            if (result.favorited) {
              migrated.push(favorite);
              migratedIds.add(favorite.id);
            }
          } catch {
            // Keep the guest copy for a later retry.
          }
        }

        if (cancelled) return;
        write(migrated, KEY);
        if (missing.every((favorite) => migratedIds.has(favorite.id))) {
          window.localStorage.removeItem(GUEST_KEY);
        }
      })
      .catch(() => {
        // Non-fatal — fall back to whatever's in localStorage.
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);
}
