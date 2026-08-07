import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Secure wrapper for the auth token. Backed by [FlutterSecureStorage] so the
/// token never lands in plaintext SharedPreferences.
class TokenStorage {
  static const _tokenKey = 'token';

  final FlutterSecureStorage _storage;

  TokenStorage([FlutterSecureStorage? storage])
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
            );

  Future<String?> read() => _storage.read(key: _tokenKey);

  Future<void> write(String token) => _storage.write(key: _tokenKey, value: token);

  Future<void> clear() => _storage.delete(key: _tokenKey);
}
