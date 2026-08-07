import { useQuery, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '@/lib/api';

export interface AuthUser {
  id: string;
  name: string;
  role: string;
  phone?: string;
  // storeId is derived from /stores/my-dashboard; not part of /auth/me by default
  storeId?: string;
}

/**
 * Central "am I logged in?" hook.
 *
 * Calls GET /auth/me — the request carries the HttpOnly `auth_token` cookie
 * automatically via `withCredentials: true` (see src/lib/api.ts).
 *
 * - `data` is the current user, or `null` if the server rejected the request.
 * - `isLoading` is true only during the very first fetch.
 * - Invalidate `['me']` to re-check after login/logout.
 */
export function useAuth() {
  return useQuery<AuthUser | null>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const res = await vendorApi().get('/auth/me');
        return res.data as AuthUser;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Helper to invalidate the auth query after login/logout.
 */
export function useInvalidateAuth() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['me'] });
}
