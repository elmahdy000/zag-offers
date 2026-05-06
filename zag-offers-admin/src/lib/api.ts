import axios from 'axios';

function resolveApiUrl() {
  const envBase = process.env.NEXT_PUBLIC_API_URL?.trim();

  // If env is set, normalize it whether it ends with /api or not.
  if (envBase) {
    const normalized = envBase.replace(/\/+$/, '');
    return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
  }

  // Browser fallback: use same host as dashboard, backend on 3001.
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    return `${protocol}//${host}:3001/api`;
  }

  // SSR fallback.
  return 'https://api.zagoffers.online/api';
}

const API_URL = resolveApiUrl();

/** تحويل المسار النسبي لصورة إلى رابط كامل */
export function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  const baseDomain = API_URL.replace(/\/api$/, '');
  let cleanPath = path;

  // إذا كان المسار لا يبدأ بـ /uploads/ وهو مسار محلي، نضيفه
  if (!cleanPath.startsWith('/uploads/') && !cleanPath.startsWith('uploads/')) {
    cleanPath = cleanPath.startsWith('/') ? `/uploads${cleanPath}` : `/uploads/${cleanPath}`;
  } else {
    // التأكد من وجود شرطة مائلة واحدة في البداية
    cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  }

  return `${baseDomain}${cleanPath}`;
}

/** Read a cookie value from browser */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Remove cookie */
export function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

const _axiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

_axiosInstance.interceptors.request.use((config) => {
  const token = getCookie('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

_axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error Message:', error.message);
    if (error.response) {
      console.error('API Error Status:', error.response.status);
    }
    if (error.config) {
      console.error('API Error Path:', error.config.url);
    }
    return Promise.reject(error);
  }
);

export function adminApi() {
  return _axiosInstance;
}

export const api = _axiosInstance;
