import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Secure wrapper for the auth token. Backed by [FlutterSecureStorage] so the
/// token never lands in plaintext SharedPreferences.
class TokenStorage {
  static const _tokenKey = 'token';

  final FlutterSecureStorage _storage;
  final SharedPreferences _prefs;

  TokenStorage(this._prefs, [FlutterSecureStorage? storage])
    : _storage =
          storage ??
          const FlutterSecureStorage(
            aOptions: AndroidOptions(encryptedSharedPreferences: true),
          );

  Future<String?> read() async {
    final secureToken = await _storage.read(key: _tokenKey);
    if (secureToken != null && secureToken.isNotEmpty) return secureToken;

    final legacyToken = _prefs.getString(_tokenKey);
    if (legacyToken == null || legacyToken.isEmpty) return null;
    await write(legacyToken);
    await _prefs.remove(_tokenKey);
    return legacyToken;
  }

  Future<void> write(String token) async {
    await _storage.write(key: _tokenKey, value: token);
    await _prefs.remove(_tokenKey);
  }

  Future<void> clear() async {
    await _storage.delete(key: _tokenKey);
    await _prefs.remove(_tokenKey);
  }
}
