import 'package:dio/dio.dart';
import 'package:zag_offers_vendor_app/features/auth/data/models/user_model.dart';
import 'package:zag_offers_vendor_app/core/network/api_client.dart';

abstract class ProfileRemoteDataSource {
  Future<UserModel> getProfile();
  Future<UserModel> updateProfile(Map<String, dynamic> data);
  Future<void> changePassword({required String currentPassword, required String newPassword});
}

class ProfileRemoteDataSourceImpl implements ProfileRemoteDataSource {
  final ApiClient apiClient;

  ProfileRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<UserModel> getProfile() async {
    try {
      final response = await apiClient.dio.get('/auth/me');
      return UserModel.fromJson(response.data);
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }

  @override
  Future<UserModel> updateProfile(Map<String, dynamic> data) async {
    try {
      final response = await apiClient.dio.patch('/auth/profile', data: data);
      return UserModel.fromJson(response.data);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? e.message);
    }
  }

  @override
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      await apiClient.dio.post('/auth/password', data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      });
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? e.message ?? 'فشل تغيير كلمة المرور');
    }
  }
}
