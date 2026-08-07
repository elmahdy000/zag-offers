/**
 * Plain localStorage cache wrapper for non-secret app data
 * (offline queues, offer drafts, cached lists, perf metrics, PWA dismissal, etc.).
 *
 * NOTE: This is NOT for secrets. Auth tokens live in an HttpOnly cookie set by
 * the backend; user identity is fetched via the `useAuth()` hook.
 */

// keys that get wiped on logout (cache only — no auth token here)
const KEYS_TO_CLEAR = [
  'cache_vendor_stats',
  'cache_vendor_offers_list',
  'cache_vendor_coupons',
  'cache_new_offer_draft',
  'pending_redemptions',
  'vendor_recent_scans',
  'zag_offline_sync_queue',
  'zag_performance_metrics',
];

export const localCache = {
  set: (key: string, value: unknown): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('localCache.set failed', e);
    }
  },

  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (e) {
      console.error('localCache.get failed', e);
      return null;
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('localCache.remove failed', e);
    }
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    try {
      KEYS_TO_CLEAR.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.error('localCache.clear failed', e);
    }
  },
};
