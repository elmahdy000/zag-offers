import 'package:shared_preferences/shared_preferences.dart';

abstract class AuthLocalDataSource {
  Future<void> cacheToken(String token);
  Future<String?> getToken();
  Future<void> cacheUserId(String userId);
  Future<String?> getUserId();
  Future<void> cacheUserName(String name);
  Future<String?> getUserName();
  Future<void> cacheUserRole(String role);
  Future<String?> getUserRole();
  Future<void> clearCache();
}

class AuthLocalDataSourceImpl implements AuthLocalDataSource {
  final SharedPreferences sharedPreferences;

  static const _tokenKey   = 'auth_token';
  static const _userIdKey  = 'user_id';
  static const _userNameKey = 'user_name';
  static const _userRoleKey = 'user_role';

  AuthLocalDataSourceImpl({required this.sharedPreferences});

  @override
  Future<void> cacheToken(String token) async =>
      sharedPreferences.setString(_tokenKey, token);

  @override
  Future<String?> getToken() async =>
      sharedPreferences.getString(_tokenKey);

  @override
  Future<void> cacheUserId(String userId) async =>
      sharedPreferences.setString(_userIdKey, userId);

  @override
  Future<String?> getUserId() async =>
      sharedPreferences.getString(_userIdKey);

  @override
  Future<void> cacheUserName(String name) async =>
      sharedPreferences.setString(_userNameKey, name);

  @override
  Future<String?> getUserName() async =>
      sharedPreferences.getString(_userNameKey);

  @override
  Future<void> cacheUserRole(String role) async =>
      sharedPreferences.setString(_userRoleKey, role);

  @override
  Future<String?> getUserRole() async =>
      sharedPreferences.getString(_userRoleKey);

  @override
  Future<void> clearCache() async {
    await sharedPreferences.remove(_tokenKey);
    await sharedPreferences.remove(_userIdKey);
    await sharedPreferences.remove(_userNameKey);
    await sharedPreferences.remove(_userRoleKey);
  }
}
