"use client";

/**
 * useAuth — single source of truth for the current session.
 *
 * The actual auth token lives in an HttpOnly cookie (invisible to JS).
 * We call `/auth/me` to resolve the user object; the query is cached and
 * shared across the tree via TanStack Query. A cheap `localStorage.user`
 * marker (set by /login) gates the initial request so we don't hammer the
 * API for anonymous visitors.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useSyncExternalStore } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import { queryKeys, staleTimes } from '@/lib/queries';
import { clearFavoriteCache } from '@/lib/favorites';

export interface AuthUser {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
  avatar?: string;
}

const MARKER_KEY = 'user';
const MARKER_EVENT = 'zag:auth-marker-changed';

function readMarker(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.localStorage.getItem(MARKER_KEY);
}

const subscribeMarker = (fn: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(MARKER_EVENT, fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === MARKER_KEY) fn();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(MARKER_EVENT, fn);
    window.removeEventListener('storage', onStorage);
  };
};

/** Reactively track the presence of the local auth marker. */
export function useAuthMarker(): boolean {
  return useSyncExternalStore(
    subscribeMarker,
    readMarker,
    () => false,
  );
}

/** Set or clear the local marker + notify subscribers. Call this after login/logout. */
export function setAuthMarker(value: boolean, user?: AuthUser) {
  if (typeof window === 'undefined') return;
  if (value) {
    window.localStorage.setItem(MARKER_KEY, JSON.stringify(user ?? { loggedIn: true }));
  } else {
    window.localStorage.removeItem(MARKER_KEY);
    clearFavoriteCache();
  }
  window.dispatchEvent(new Event(MARKER_EVENT));
  window.dispatchEvent(new Event('auth-change'));
}

/** Resolve the current user (or null). Safe to call anywhere in the tree. */
export function useAuth() {
  const hasMarker = useAuthMarker();
  const query = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: ({ signal }) => apiClient.get<AuthUser>('/auth/me', undefined, signal),
    enabled: hasMarker,
    staleTime: staleTimes.auth,
    retry: (failureCount, error) => {
      // Don't retry on 401 — clear the stale marker and stop trying.
      if (error instanceof ApiError && error.status === 401) return false;
      return failureCount < 1;
    },
  });

  // If the marker exists but the server rejects it, drop the marker.
  useEffect(() => {
    if (query.isError && query.error instanceof ApiError && query.error.status === 401) {
      setAuthMarker(false);
    }
  }, [query.isError, query.error]);

  return {
    user: query.data ?? null,
    isLoggedIn: !!query.data,
    isLoading: hasMarker && query.isPending,
    error: query.isError ? query.error : null,
    refetch: query.refetch,
  };
}

/** Convenience mutation-style helpers for callers that only need the boolean. */
export function useLogoutAction() {
  const queryClient = useQueryClient();
  return async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Even if the server call fails, clear client state.
    }
    setAuthMarker(false);
    queryClient.setQueryData(queryKeys.auth.me, null);
    void queryClient.invalidateQueries();
  };
}
