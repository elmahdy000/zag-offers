import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { optimizeUploadFormData } from './image-upload';

type TimedRequestConfig = InternalAxiosRequestConfig & {
  metadata?: { startTime: number };
};

const configuredApiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online').replace(/\/+$/, '');
const API_URL = configuredApiUrl.endsWith('/api') ? configuredApiUrl : `${configuredApiUrl}/api`;

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

import { getCookie, deleteCookie } from './cookie-utils';
export { getCookie, deleteCookie };

/** تحويل المسار النسبي لصورة إلى رابط كامل */


import { secureUserData, secureStoreData, secureStorage } from './crypto';

/** قراءة بيانات المستخدم المخزنة بشكل آمن */
export function getVendorUser() {
  if (typeof window === 'undefined') return null;
  return secureUserData.load();
}

/** قراءة storeId الأول للتاجر بشكل آمن */
export function getVendorStoreId() {
  if (typeof window === 'undefined') return null;
  return secureStoreData.load();
}

export interface Offer {
  id: string;
  title: string;
  status: string;
  views: number;
  createdAt: string;
  images: string[];
  _count: {
    coupons: number;
  };
}

import { PerformanceMonitor } from './performance-monitor';

/** إنشاء توقيع آمن للطلب (Request Signing) */
function signRequest(url: string, timestamp: number) {
  // عملية أساسية بدون مفتاح سري حتى لا نكشفه في bundle المتصفح.
  // سيتم تفعيل التوقيع الكامل لاحقاً في service worker أو proxy.
  return btoa(`${url}|${timestamp}`).slice(0, 32);
}

/** Axios instance مع Authorization header وتتبع الأداء وتوقيع الطلبات */
let sharedVendorApi: ReturnType<typeof axios.create> | null = null;

export function vendorApi() {
  if (sharedVendorApi) return sharedVendorApi;
  const token = getCookie('auth_token');
  const instance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // تتبع وقت بداية الطلب وتوقيع الطلب
  instance.interceptors.request.use(async (config) => {
    const timestamp = Date.now();
    (config as TimedRequestConfig).metadata = { startTime: timestamp };
    const activeToken = getCookie('auth_token');
    if (activeToken) config.headers.Authorization = `Bearer ${activeToken}`;
    else delete config.headers.Authorization;
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      config.data = await optimizeUploadFormData(config.data);
    }
    
    // إضافة هيدرز الأمان
    config.headers['X-Request-Timestamp'] = timestamp.toString();
    config.headers['X-Request-Signature'] = signRequest(config.url || '', timestamp);
    
    return config;
  });

  // تتبع وقت نهاية الطلب وحساب المدة + معالجة الأخطاء
  instance.interceptors.response.use(
    (response) => {
      const startTime = (response.config as TimedRequestConfig).metadata?.startTime;
      if (startTime) {
        const duration = Date.now() - startTime;
        PerformanceMonitor.log('API_LATENCY', response.config.url || 'unknown', duration, {
          status: response.status,
          method: response.config.method?.toUpperCase()
        });
      }
      return response;
    },
    (error: AxiosError) => {
      const startTime = (error.config as TimedRequestConfig | undefined)?.metadata?.startTime;
      if (startTime) {
        const duration = Date.now() - startTime;
        PerformanceMonitor.log('API_LATENCY', error.config?.url || 'unknown', duration, {
          status: error.response?.status,
          error: true
        });
      }
      if ((error.response?.status === 401 || error.response?.status === 403) && typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        deleteCookie('auth_token');
        if (typeof secureStorage !== 'undefined') secureStorage.clear();
        const reason = error.response.status === 403 ? 'unauthorized' : 'session-expired';
        window.location.replace(`/login?reason=${reason}`);
      }
      return Promise.reject(error);
    }
  );

  sharedVendorApi = instance;
  return sharedVendorApi;
}
