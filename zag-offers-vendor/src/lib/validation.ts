/**
 * مكتبة التحقق من صحة البيانات والملفات
 * Security validation utilities for Zag Offers Vendor App
 */

import { z } from 'zod';

// Types للملفات الصالحة
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGE_DIMENSION = 2048; // 2048px

/**
 * التحقق من صحة الملف المرفوع
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // التحقق من نوع الملف
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: 'نوع الملف غير مدعوم. يرجى استخدام صور من نوع JPG, PNG, أو WebP'
    };
  }

  // التحقق من حجم الملف
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'حجم الملف كبير جداً. الحد الأقصى هو 5 ميجابايت'
    };
  }

  // التحقق من اسم الملف
  if (file.name.length > 255) {
    return {
      valid: false,
      error: 'اسم الملف طويل جداً'
    };
  }

  return { valid: true };
};

/**
 * التحقق من أبعاد الصورة
 */
export const validateImageDimensions = (file: File): Promise<{ valid: boolean; error?: string }> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      
      if (img.width > MAX_IMAGE_DIMENSION || img.height > MAX_IMAGE_DIMENSION) {
        resolve({
          valid: false,
          error: `أبعاد الصورة كبيرة جداً. الحد الأقصى هو ${MAX_IMAGE_DIMENSION} بكسل`
        });
      } else {
        resolve({ valid: true });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        valid: false,
        error: 'الملف ليس صورة صالحة'
      });
    };

    img.src = url;
  });
};

/**
 * التحقق من صحة بيانات العرض
 */
export const offerSchema = z.object({
  title: z.string()
    .min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل')
    .max(100, 'العنوان يجب أن لا يتجاوز 100 حرف')
    .regex(/^[\u0621-\u064A\w\s\d\-_.,!?%]+$/, 'العنوان يحتوي على حروف غير صالحة'),
  discount: z.string()
    .regex(/^\d{1,3}%?$/, 'صيغة الخصم غير صحيحة. استخدم مثال: 50% أو 50')
    .refine(val => {
      const num = parseInt(val.replace('%', ''));
      return num > 0 && num <= 100;
    }, 'نسبة الخصم يجب أن تكون بين 1% و 100%'),
  description: z.string()
    .max(500, 'الوصف يجب أن لا يتجاوز 500 حرف')
    .optional(),
  endDate: z.string()
    .refine(date => {
      const endDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return endDate > today;
    }, 'تاريخ الانتهاء يجب أن يكون في المستقبل'),
  originalPrice: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'السعر يجب أن يكون رقماً صحيحاً')
    .refine(val => {
      const price = parseFloat(val);
      return price > 0 && price <= 999999;
    }, 'السعر يجب أن يكون بين 1 و 999,999')
    .optional()
});

/**
 * التحقق من صحة بيانات المتجر
 */
export const storeSchema = z.object({
  name: z.string()
    .min(3, 'اسم المتجر يجب أن يكون 3 أحرف على الأقل')
    .max(50, 'اسم المتجر يجب أن لا يتجاوز 50 حرف'),
  phone: z.string()
    .regex(/^01[0125]\d{8}$/, 'رقم الموبايل مصري غير صحيح'),
  whatsapp: z.string()
    .regex(/^01[0125]\d{8}$/, 'رقم الواتساب مصري غير صحيح')
    .optional(),
  address: z.string()
    .min(10, 'العنوان يجب أن يكون 10 أحرف على الأقل')
    .max(200, 'العنوان يجب أن لا يتجاوز 200 حرف'),
  locationUrl: z.string()
    .url('رابط الموقع غير صحيح')
    .refine(url => url.includes('maps.google.com') || url.includes('goo.gl/maps'), 'يرجى استخدام رابط جوجل ماب')
    .optional()
});

/**
 * التحقق من صحة رقم الموبايل المصري
 */
export const validateEgyptianPhone = (phone: string): boolean => {
  const phoneRegex = /^01[0125]\d{8}$/;
  return phoneRegex.test(phone.trim());
};

/**
 * تنظيف المدخلات من الأحرف الخطرة
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

/**
 * التحقق من قوة كلمة المرور
 */
export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 6) {
    return { valid: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' };
  }

  if (password.length > 50) {
    return { valid: false, error: 'كلمة المرور طويلة جداً' };
  }

  // التحقق من وجود أحرف بسيطة فقط
  if (/^[a-zA-Z]+$/.test(password)) {
    return { valid: false, error: 'كلمة المرور يجب أن تحتوي على أرقام أو رموز' };
  }

  return { valid: true };
};

export type OfferFormData = z.infer<typeof offerSchema>;
export type StoreFormData = z.infer<typeof storeSchema>;
