import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:crypto/crypto.dart';

class CryptoUtils {
  static const String _userKey = 'vendor_user';
  static const String _cachePrefix = 'cache_vendor_';

  // Secure storage (React app compatibility)
  static Future<Map<String, dynamic>?> loadSecureUserData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userData = prefs.getString(_userKey);
      
      if (userData != null) {
        return Map<String, dynamic>.from(jsonDecode(userData));
      }
    } catch (e) {
      // Handle error silently
    }
    return null;
  }

  static Future<void> saveSecureUserData(Map<String, dynamic> userData) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_userKey, jsonEncode(userData));
    } catch (e) {
      // Handle error silently
    }
  }

  static Future<void> clearSecureUserData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_userKey);
    } catch (e) {
      // Handle error silently
    }
  }

  // Cache management (React app compatibility)
  static Future<T?> getCache<T>(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = '$_cachePrefix$key';
      final cachedData = prefs.getString(cacheKey);
      
      if (cachedData != null) {
        final decoded = jsonDecode(cachedData);
        if (decoded is T) {
          return decoded;
        }
      }
    } catch (e) {
      // Handle error silently
    }
    return null;
  }

  static Future<void> setCache(String key, dynamic data) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = '$_cachePrefix$key';
      await prefs.setString(cacheKey, jsonEncode(data));
    } catch (e) {
      // Handle error silently
    }
  }

  static Future<void> clearCache(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = '$_cachePrefix$key';
      await prefs.remove(cacheKey);
    } catch (e) {
      // Handle error silently
    }
  }

  static Future<void> clearAllCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      
      for (final key in keys) {
        if (key.startsWith(_cachePrefix)) {
          await prefs.remove(key);
        }
      }
    } catch (e) {
      // Handle error silently
    }
  }

  // Simple encryption for sensitive data
  static String encrypt(String text, String key) {
    final bytes = utf8.encode(text);
    final keyBytes = utf8.encode(key);
    final encrypted = <int>[];
    
    for (int i = 0; i < bytes.length; i++) {
      encrypted.add(bytes[i] ^ keyBytes[i % keyBytes.length]);
    }
    
    return base64Encode(encrypted);
  }

  static String decrypt(String encryptedText, String key) {
    final encrypted = base64Decode(encryptedText);
    final keyBytes = utf8.encode(key);
    final decrypted = <int>[];
    
    for (int i = 0; i < encrypted.length; i++) {
      decrypted.add(encrypted[i] ^ keyBytes[i % keyBytes.length]);
    }
    
    return utf8.decode(decrypted);
  }

  // Generate hash for data integrity
  static String generateHash(String data) {
    final bytes = utf8.encode(data);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  // Validate data integrity
  static bool validateHash(String data, String hash) {
    return generateHash(data) == hash;
  }
}
