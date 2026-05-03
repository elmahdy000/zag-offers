import axios from 'axios';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api';

/** قراءة قيمة كوكي من المتصفح */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

/** حذف كوكي */
export function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/**
 * Instance واحدة ثابتة — بدل ما نعمل axios.create() مع كل request
 * الـ interceptor بيضيف الـ token تلقائياً قبل كل طلب
 */
const _axiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
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
    console.error('❌ API Error Message:', error.message);
    if (error.response) {
      console.error('❌ API Error Status:', error.response.status);
      console.error('❌ API Error Data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.config) {
      console.error('❌ API Error Path:', error.config.url);
    }
    return Promise.reject(error);
  }
);

/** ترجع نفس الـ instance دايماً — لا تعمل instance جديدة مع كل استدعاء */
export function adminApi() {
  return _axiosInstance;
}

/** Alias مباشر للـ instance */
export const api = _axiosInstance;
