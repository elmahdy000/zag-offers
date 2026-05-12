import axios from 'axios';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online').replace(/\/$/, '') + '/api';

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


import { secureUserData, secureStoreData } from './crypto';

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
  // في بيئة حقيقية، نستخدم مفتاح سري لا يظهر في الفرونت-إند
  // هنا نستخدم نموذجاً لتوضيح المبدأ الأمني
  const secret = 'zag_secure_v1';
  return btoa(`${url}|${timestamp}|${secret}`).slice(0, 32);
}

/** Axios instance مع Authorization header وتتبع الأداء وتوقيع الطلبات */
export function vendorApi() {
  const token = getCookie('auth_token');
  const instance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // تتبع وقت بداية الطلب وتوقيع الطلب
  instance.interceptors.request.use((config) => {
    const timestamp = Date.now();
    (config as any).metadata = { startTime: timestamp };
    
    // إضافة هيدرز الأمان
    config.headers['X-Request-Timestamp'] = timestamp.toString();
    config.headers['X-Request-Signature'] = signRequest(config.url || '', timestamp);
    
    return config;
  });

  // تتبع وقت نهاية الطلب وحساب المدة
  instance.interceptors.response.use(
    (response) => {
      const startTime = (response.config as any).metadata?.startTime;
      if (startTime) {
        const duration = Date.now() - startTime;
        PerformanceMonitor.log('API_LATENCY', response.config.url || 'unknown', duration, {
          status: response.status,
          method: response.config.method?.toUpperCase()
        });
      }
      return response;
    },
    (error) => {
      const startTime = (error.config as any)?.metadata?.startTime;
      if (startTime) {
        const duration = Date.now() - startTime;
        PerformanceMonitor.log('API_LATENCY', error.config?.url || 'unknown', duration, {
          status: error.response?.status,
          error: true
        });
      }
      return Promise.reject(error);
    }
  );

  return instance;
}
