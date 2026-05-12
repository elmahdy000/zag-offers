/**
 * تشفير وفك تشفير البيانات الحساسة
 * Encryption utilities for secure storage
 */

// Simple XOR encryption for client-side (not for highly sensitive data)
// Note: This is basic obfuscation, not military-grade encryption
// For production, consider using Web Crypto API

const ENCRYPTION_KEY = 'zag-offers-vendor-2024-secure-key';

/**
 * تشفير النص
 */
export const encrypt = (text: string): string => {
  try {
    // Convert to base64 first
    const encoded = btoa(unescape(encodeURIComponent(text)));
    
    // Simple XOR cipher
    let encrypted = '';
    for (let i = 0; i < encoded.length; i++) {
      encrypted += String.fromCharCode(
        encoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      );
    }
    
    return btoa(encrypted);
  } catch (error) {
    console.error('Encryption failed:', error);
    return text; // Fallback to plain text
  }
};

/**
 * فك تشفير النص
 */
export const decrypt = (encryptedText: string): string => {
  try {
    // Decode from base64
    const encrypted = atob(encryptedText);
    
    // Reverse XOR cipher
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      decrypted += String.fromCharCode(
        encrypted.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      );
    }
    
    // Decode from base64
    return decodeURIComponent(escape(atob(decrypted)));
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedText; // Fallback to encrypted text
  }
};

/**
 * التحقق إذا كان النص مشفر
 */
export const isEncrypted = (text: string): boolean => {
  try {
    // Simple check: try to decrypt, if fails it's not encrypted
    decrypt(text);
    return true;
  } catch {
    return false;
  }
};

/**
 * Secure Storage API
 */
export const secureStorage = {
  /**
   * حفظ قيمة مشفرة
   */
  set: (key: string, value: any): void => {
    if (typeof window === 'undefined') return;
    
    try {
      const serialized = JSON.stringify(value);
      const encrypted = encrypt(serialized);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to save to secure storage:', error);
      // Fallback to regular localStorage
      localStorage.setItem(key, JSON.stringify(value));
    }
  },

  /**
   * جلب قيمة وفك تشفيرها
   */
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      
      // Check if it's encrypted
      if (isEncrypted(encrypted)) {
        const decrypted = decrypt(encrypted);
        return JSON.parse(decrypted);
      } else {
        // Legacy data (not encrypted)
        return JSON.parse(encrypted);
      }
    } catch (error) {
      console.error('Failed to read from secure storage:', error);
      return null;
    }
  },

  /**
   * حذف قيمة
   */
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from secure storage:', error);
    }
  },

  /**
   * مسح كل البيانات
   */
  clear: (): void => {
    if (typeof window === 'undefined') return;
    
    try {
      const keysToRemove = [
        'vendor_user',
        'vendor_store_id',
        'cache_vendor_stats',
        'cache_vendor_offers_list',
        'pending_redemptions',
        'vendor_recent_scans'
      ];
      
      keysToRemove.forEach(key => {
        secureStorage.remove(key);
      });
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }
  }
};

/**
 * تشفير بيانات المستخدم الحساسة
 */
export const secureUserData = {
  save: (user: { id: string; name: string; role: string; phone?: string }): void => {
    secureStorage.set('vendor_user', user);
  },

  load: (): { id: string; name: string; role: string; phone?: string } | null => {
    return secureStorage.get('vendor_user');
  },

  remove: (): void => {
    secureStorage.remove('vendor_user');
  }
};

/**
 * تشفير بيانات المتجر
 */
export const secureStoreData = {
  save: (storeId: string): void => {
    secureStorage.set('vendor_store_id', storeId);
  },

  load: (): string | null => {
    return secureStorage.get('vendor_store_id');
  },

  remove: (): void => {
    secureStorage.remove('vendor_store_id');
  }
};
