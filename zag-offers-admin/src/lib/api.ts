import axios from 'axios';
import type { AxiosError } from 'axios';
import { optimizeUploadFormData } from './image-upload';

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

const _axiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true,
});

_axiosInstance.interceptors.request.use(async (config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.data = await optimizeUploadFormData(config.data);
  }
  return config;
});

_axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_user');
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function adminApi() {
  return _axiosInstance;
}

export const api = _axiosInstance;

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as AxiosError<{ message?: string | string[] }>).response?.data?.message;
  return Array.isArray(message) ? message.join('، ') : message || fallback;
}
