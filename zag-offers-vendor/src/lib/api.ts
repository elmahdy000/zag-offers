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


/** قراءة بيانات المستخدم المخزنة */
export function getVendorUser(): { id: string; name: string; role: string } | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem('vendor_user');
    return raw ? (JSON.parse(raw) as { id: string; name: string; role: string }) : null;
  } catch {
    return null;
  }
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

/** قراءة storeId الأول للتاجر */
export function getVendorStoreId(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('vendor_store_id');
}

/** Axios instance مع Authorization header تلقائي */
export function vendorApi() {
  const token = getCookie('auth_token');
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
