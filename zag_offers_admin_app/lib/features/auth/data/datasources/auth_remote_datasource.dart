import 'package:flutter/foundation.dart';
import 'package:zag_offers_admin_app/core/network/api_client.dart';
import 'package:zag_offers_admin_app/features/auth/data/models/admin_user_model.dart';

abstract class AuthRemoteDataSource {
  Future<Map<String, dynamic>> login(String phone, String password);
  Future<AdminUserModel> getProfile();
  Future<AdminUserModel> updateProfile({String? name, String? area});
  Future<void> updatePassword(String currentPassword, String newPassword);
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient client;

  AuthRemoteDataSourceImpl({required this.client});

  @override
  Future<Map<String, dynamic>> login(String phone, String password) async {
    final response = await client.post(
      '/auth/login',
      data: {'phone': phone, 'password': password},
    );
    return response.data;
  }

  @override
  Future<AdminUserModel> getProfile() async {
    try {
      final response = await client
          .get('/auth/me')
          .timeout(const Duration(seconds: 3));
      return AdminUserModel.fromJson(response.data);
    } catch (e) {
      debugPrint('Profile fetch error: $e');
      rethrow;
    }
  }

  @override
  Future<AdminUserModel> updateProfile({String? name, String? area}) async {
    final response = await client.patch(
      '/auth/profile',
      data: {if (name != null) 'name': name, if (area != null) 'area': area},
    );
    return AdminUserModel.fromJson(response.data);
  }

  @override
  Future<void> updatePassword(
    String currentPassword,
    String newPassword,
  ) async {
    await client.post(
      '/auth/password',
      data: {'currentPassword': currentPassword, 'newPassword': newPassword},
    );
  }
}
