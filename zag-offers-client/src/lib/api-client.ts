/**
 * Centralized HTTP client for the public site.
 * - Uses `API_URL` (may point at a Next.js rewrite proxy in local dev).
 * - Sends cookies via `credentials: 'include'` so HttpOnly auth works.
 * - Cache-busts on every call (public data is refreshed by the query layer).
 */
import { API_URL } from './constants';

export class ApiError extends Error {
  status: number;
  body?: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, query?: Query): string {
  const url = new URL(
    `${API_URL}${path.startsWith('/') ? path : `/${path}`}`,
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  const absolute = url.toString();
  // Strip the fake origin we prepended for relative API_URL values ("/proxy-api/...")
  return API_URL.startsWith('http') ? absolute : absolute.replace(url.origin, '');
}

async function request<T>(
  method: string,
  path: string,
  init?: { query?: Query; body?: unknown; signal?: AbortSignal },
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: BodyInit | undefined;
  if (init?.body !== undefined) {
    if (init.body instanceof FormData) {
      body = init.body;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(init.body);
    }
  }

  const res = await fetch(buildUrl(path, init?.query), {
    method,
    headers,
    body,
    credentials: 'include',
    cache: 'no-store',
    signal: init?.signal,
  });

  if (!res.ok) {
    let payload: unknown;
    try {
      payload = await res.json();
    } catch {
      payload = await res.text().catch(() => undefined);
    }
    let message = `HTTP ${res.status}`;
    if (payload && typeof payload === 'object' && 'message' in payload) {
      const raw = (payload as { message: unknown }).message;
      if (typeof raw === 'string' && raw) message = raw;
      else if (Array.isArray(raw) && raw.length) message = String(raw[0]);
    }
    throw new ApiError(res.status, message, payload);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const apiClient = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>('GET', path, { query, signal }),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) => request<T>('POST', path, { body, signal }),
  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) => request<T>('PATCH', path, { body, signal }),
  put: <T>(path: string, body?: unknown, signal?: AbortSignal) => request<T>('PUT', path, { body, signal }),
  delete: <T>(path: string, signal?: AbortSignal) => request<T>('DELETE', path, { signal }),
};
