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

/** تنسيق نسبة الخصم - يضيف % إذا كانت قيمة رقمية */
export function formatDiscount(discount: string): string {
  if (!discount) return '';
  // إذا كانت قيمة رقمية فقط (بدون %)
  if (/^\d+(\.\d+)?$/.test(discount.trim())) {
    return `${discount.trim()}%`;
  }
  return discount;
}

/** حساب الأيام المتبقية حتى تاريخ معين */
export function calculateDaysLeft(endDate: string | Date): number {
  try {
    const end = new Date(endDate);
    // Check if date is valid
    if (isNaN(end.getTime())) {
      return 0;
    }
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}
