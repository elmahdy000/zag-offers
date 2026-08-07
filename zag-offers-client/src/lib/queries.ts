/**
 * Central query registry.
 *
 * Every remote read the public app performs lives here — with a stable query
 * key, a typed fetcher, and sensible default options. Pages consume via
 * `useQuery(...)` (or a small hook below) instead of hand-rolling fetch+cache.
 *
 * Why: 5 pages used to duplicate ~200 lines of fetch + localStorage + polling
 * + online/offline plumbing. TanStack Query handles all of that for us —
 * stale-while-revalidate, retries, refetch on focus, background sync — and
 * gives us a single source of truth per resource.
 */
import { apiClient } from './api-client';
import { normalizeCategories } from './category-utils';
import type { Offer, Store, Banner } from './types';

// ─── Query keys ────────────────────────────────────────────────────────────
// Objects (never bare strings) so we can invalidate whole families cleanly.
export const queryKeys = {
  offers: {
    all: ['offers'] as const,
    list: (params?: { limit?: number }) => ['offers', 'list', params ?? {}] as const,
    byId: (id: string) => ['offers', 'byId', id] as const,
    categories: ['offers', 'categories'] as const,
    banners: ['offers', 'banners'] as const,
    search: (q: string) => ['offers', 'search', q] as const,
  },
  stores: {
    all: ['stores'] as const,
    list: (params?: { limit?: number }) => ['stores', 'list', params ?? {}] as const,
    byId: (id: string) => ['stores', 'byId', id] as const,
  },
  coupons: {
    all: ['coupons'] as const,
    mine: ['coupons', 'mine'] as const,
  },
  recommendations: ['recommendations'] as const,
  auth: {
    me: ['auth', 'me'] as const,
  },
} as const;

// ─── Fetchers (thin, typed, testable) ──────────────────────────────────────
export const queryFns = {
  listOffers: (params: { limit?: number } = {}, signal?: AbortSignal) =>
    apiClient.get<Offer[]>('/offers', { limit: params.limit }, signal),

  offerById: (id: string, signal?: AbortSignal) =>
    apiClient.get<Offer>(`/offers/${id}`, undefined, signal),

  searchOffers: (q: string, signal?: AbortSignal) =>
    apiClient.get<Offer[]>('/offers/search', { q }, signal),

  listCategories: async (signal?: AbortSignal) => {
    const raw = await apiClient.get<unknown>('/offers/categories', undefined, signal);
    return normalizeCategories(raw);
  },

  listBanners: (signal?: AbortSignal) =>
    apiClient.get<Banner[]>('/offers/banners', undefined, signal),

  listStores: (params: { limit?: number } = {}, signal?: AbortSignal) =>
    apiClient.get<Store[]>('/stores', { limit: params.limit }, signal),

  storeById: (id: string, signal?: AbortSignal) =>
    apiClient.get<Store>(`/stores/${id}`, undefined, signal),

  recommendations: (signal?: AbortSignal) =>
    apiClient.get<Offer[]>('/recommendations', undefined, signal),

  myCoupons: (signal?: AbortSignal) =>
    apiClient.get<unknown[]>('/coupons/mine', undefined, signal),
};

// ─── Default stale/retry policies per resource ─────────────────────────────
// Small helper so pages don't need to remember these numbers.
export const staleTimes = {
  // Rarely change — shown across many pages. Big cache wins here.
  categories: 5 * 60 * 1000,
  banners: 5 * 60 * 1000,
  stores: 3 * 60 * 1000,
  // Change more often (new offers). Keep fresh, but not aggressive.
  offers: 60 * 1000,
  offerDetail: 60 * 1000,
  recommendations: 2 * 60 * 1000,
  // Personal — refresh on focus.
  myCoupons: 30 * 1000,
  auth: 60 * 1000,
} as const;
