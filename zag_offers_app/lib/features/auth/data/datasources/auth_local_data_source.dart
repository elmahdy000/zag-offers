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
  Future<void> cacheAvatarUrl(String url);
  Future<String?> getCachedAvatarUrl();
  Future<void> cachePoints(int points);
  Future<int> getPoints();
  Future<void> cacheTier(String tier);
  Future<String> getTier();
  Future<void> cacheReferralCode(String code);
  Future<String?> getReferralCode();
  Future<void> clearCache();
}

class AuthLocalDataSourceImpl implements AuthLocalDataSource {
  final SharedPreferences sharedPreferences;

  static const _tokenKey      = 'auth_token';
  static const _userIdKey     = 'user_id';
  static const _userNameKey   = 'user_name';
  static const _userRoleKey   = 'user_role';
  static const _avatarUrlKey  = 'avatar_url';
  static const _pointsKey     = 'user_points';
  static const _tierKey       = 'user_tier';
  static const _referralCodeKey = 'referral_code';

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
  Future<void> cacheAvatarUrl(String url) async =>
      sharedPreferences.setString(_avatarUrlKey, url);

  @override
  Future<String?> getCachedAvatarUrl() async =>
      sharedPreferences.getString(_avatarUrlKey);

  @override
  Future<void> cachePoints(int points) async =>
      sharedPreferences.setInt(_pointsKey, points);

  @override
  Future<int> getPoints() async =>
      sharedPreferences.getInt(_pointsKey) ?? 0;

  @override
  Future<void> cacheTier(String tier) async =>
      sharedPreferences.setString(_tierKey, tier);

  @override
  Future<String> getTier() async =>
      sharedPreferences.getString(_tierKey) ?? 'BRONZE';

  @override
  Future<void> cacheReferralCode(String code) async =>
      sharedPreferences.setString(_referralCodeKey, code);

  @override
  Future<String?> getReferralCode() async =>
      sharedPreferences.getString(_referralCodeKey);

  @override
  Future<void> clearCache() async {
    await sharedPreferences.remove(_tokenKey);
    await sharedPreferences.remove(_userIdKey);
    await sharedPreferences.remove(_userNameKey);
    await sharedPreferences.remove(_userRoleKey);
    await sharedPreferences.remove(_avatarUrlKey);
    await sharedPreferences.remove(_pointsKey);
    await sharedPreferences.remove(_tierKey);
    await sharedPreferences.remove(_referralCodeKey);
  }
}
