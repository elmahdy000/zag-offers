/**
 * معالج الأخطاء المركزي
 * Centralized Error Handler for Zag Offers Vendor App
 */

import axios from 'axios';

export interface ApiError {
  status?: number;
  message: string;
  type: 'network' | 'auth' | 'validation' | 'server' | 'unknown';
  code?: string;
}

/**
 * معالجة أخطاء API بشكل مركزي
 */
export const handleApiError = (error: unknown): ApiError => {
  // Network errors
  if (!navigator.onLine) {
    return {
      status: 0,
      message: 'لا يوجد اتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.',
      type: 'network',
      code: 'OFFLINE'
    };
  }

  // Axios errors
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    switch (status) {
      case 401:
        return {
          status,
          message: 'انتهت جلستك، برجاء تسجيل الدخول مرة أخرى',
          type: 'auth',
          code: 'SESSION_EXPIRED'
        };
        
      case 403:
        return {
          status,
          message: 'ليس لديك صلاحية للقيام بهذا الإجراء',
          type: 'auth',
          code: 'FORBIDDEN'
        };
        
      case 404:
        return {
          status,
          message: 'المورد المطلوب غير موجود',
          type: 'validation',
          code: 'NOT_FOUND'
        };
        
      case 413:
        return {
          status,
          message: 'حجم الملفات كبير جداً. الحد الأقصى هو 5 ميجابايت',
          type: 'validation',
          code: 'FILE_TOO_LARGE'
        };
        
      case 422:
        return {
          status,
          message: Array.isArray(data?.message) 
            ? data.message.join(' | ') 
            : data?.message || 'بيانات غير صحيحة',
          type: 'validation',
          code: 'VALIDATION_ERROR'
        };
        
      case 429:
        return {
          status,
          message: 'تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة بعد قليل',
          type: 'validation',
          code: 'RATE_LIMIT'
        };
        
      case 500:
        return {
          status,
          message: 'حدث خطأ في الخادم. نحن نعمل على إصلاحه',
          type: 'server',
          code: 'SERVER_ERROR'
        };
        
      case 502:
      case 503:
      case 504:
        return {
          status,
          message: 'الخدمة غير متوفرة حالياً. يرجى المحاولة لاحقاً',
          type: 'server',
          code: 'SERVICE_UNAVAILABLE'
        };
        
      default:
        return {
          status,
          message: data?.message || 'حدث خطأ غير متوقع',
          type: 'unknown',
          code: 'UNKNOWN_ERROR'
        };
    }
  }

  // Network timeout
  if (error instanceof Error && error.name === 'AbortError') {
    return {
      message: 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى',
      type: 'network',
      code: 'TIMEOUT'
    };
  }

  // Generic JavaScript errors
  if (error instanceof Error) {
    return {
      message: error.message || 'حدث خطأ غير متوقع',
      type: 'unknown',
      code: 'JAVASCRIPT_ERROR'
    };
  }

  // Unknown errors
  return {
    message: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى',
    type: 'unknown',
    code: 'UNKNOWN'
  };
};

/**
 * تسجيل الأخطاء للمراقبة
 */
export const logError = (error: ApiError, context?: string) => {
  const logData = {
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      type: error.type,
      code: error.code,
      status: error.status
    },
    context,
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  // في التطوير، نطبع في الكونسول
  if (process.env.NODE_ENV === 'development') {
    console.group('🔴 API Error');
    console.error('Error:', logData);
    console.groupEnd();
  }

  // في الإنتاج، نرسل لخدمة المراقبة (مثال)
  if (process.env.NODE_ENV === 'production') {
    // هنا ممكن نرسل لـ Sentry أو أي خدمة مراقبة
    // Sentry.captureException(error, { extra: logData });
  }
};

/**
 * عرض رسالة خطأ مناسبة للمستخدم
 */
export const getErrorMessage = (error: ApiError): string => {
  return error.message;
};

/**
 * التحقق إذا كان الخطأ يتطلب إعادة تسجيل الدخول
 */
export const requiresReauth = (error: ApiError): boolean => {
  return error.type === 'auth' && (
    error.code === 'SESSION_EXPIRED' || 
    error.code === 'FORBIDDEN'
  );
};

/**
 * التحقق إذا كان الخطأ متعلق بالشبكة
 */
export const isNetworkError = (error: ApiError): boolean => {
  return error.type === 'network';
};

/**
 * التحقق إذا كان الخطأ يتطلب تحديث الصفحة
 */
export const requiresRefresh = (error: ApiError): boolean => {
  return error.type === 'server' || 
         error.code === 'SERVICE_UNAVAILABLE' ||
         error.code === 'UNKNOWN_ERROR';
};
