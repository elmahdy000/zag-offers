import 'dart:convert';
import 'dart:developer' as dev;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:crypto/crypto.dart';

class CryptoUtils {
  static const String _userKey = 'vendor_user';
  static const String _cachePrefix = 'cache_vendor_';

  static Future<Map<String, dynamic>?> loadSecureUserData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userData = prefs.getString(_userKey);
      
      if (userData != null) {
        return Map<String, dynamic>.from(jsonDecode(userData));
      }
    } catch (e) {
      dev.log('Failed to load user data: $e');
    }
    return null;
  }

  static Future<void> saveSecureUserData(Map<String, dynamic> userData) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_userKey, jsonEncode(userData));
    } catch (e) {
      dev.log('Failed to save user data: $e');
    }
  }

  static Future<void> clearSecureUserData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_userKey);
    } catch (e) {
      dev.log('Failed to clear user data: $e');
    }
  }

  static Future<T?> getCache<T>(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = '$_cachePrefix$key';
      final cachedData = prefs.getString(cacheKey);
      
      if (cachedData != null) {
        final decoded = jsonDecode(cachedData);
        return decoded as T;
      }
    } catch (e) {
      dev.log('Failed to get cache: $e');
    }
    return null;
  }

  static Future<void> setCache(String key, dynamic data) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = '$_cachePrefix$key';
      await prefs.setString(cacheKey, jsonEncode(data));
    } catch (e) {
      dev.log('Failed to set cache: $e');
    }
  }

  static Future<void> clearCache(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = '$_cachePrefix$key';
      await prefs.remove(cacheKey);
    } catch (e) {
      dev.log('Failed to clear cache: $e');
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
      dev.log('Failed to clear all cache: $e');
    }
  }

  static String generateHash(String data) {
    final bytes = utf8.encode(data);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  static bool validateHash(String data, String hash) {
    return generateHash(data) == hash;
  }
}
