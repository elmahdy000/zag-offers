import { BASE_URL } from './constants';

/** تحويل المسار النسبي لصورة إلى رابط كامل */
export function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // إزالة الشرطة المائلة الزائدة إذا وجدت
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}
