import { BASE_URL } from './constants';

/** تحويل المسار النسبي لصورة إلى رابط كامل */
export function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  let cleanPath = path;
  
  // إذا كان المسار لا يبدأ بـ /uploads/ وهو مسار محلي، نضيفه
  if (!cleanPath.startsWith('/uploads/') && !cleanPath.startsWith('uploads/')) {
    cleanPath = cleanPath.startsWith('/') ? `/uploads${cleanPath}` : `/uploads/${cleanPath}`;
  } else {
    // التأكد من وجود شرطة مائلة واحدة في البداية
    cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  }
  
  return `${BASE_URL}${cleanPath}`;
}
