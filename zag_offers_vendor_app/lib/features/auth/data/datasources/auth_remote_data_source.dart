import 'dart:convert';
import 'dart:developer';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../../core/network/api_client.dart';
import '../models/user_model.dart';

abstract class AuthRemoteDataSource {
  Future<UserModel> login(String identifier, String password);
  Future<void> updateFcmToken(String fcmToken);
  Future<void> removeFcmToken();
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient apiClient;
  final SharedPreferences sharedPreferences;

  AuthRemoteDataSourceImpl({
    required this.apiClient,
    required this.sharedPreferences,
  });

  @override
  Future<UserModel> login(String identifier, String password) async {
    try {
      final response = await apiClient.dio.post(
        '/auth/login',
        data: {'phone': identifier, 'password': password},
      );

      final token = response.data['access_token'];
      final user = UserModel.fromJson(response.data['user']);

      // Vendor mobile app must use merchant accounts only.
      // Most vendor endpoints are protected with MERCHANT role on backend.
      if (user.role != 'MERCHANT') {
        throw Exception('هذا التطبيق مخصص لحسابات التجار فقط.');
      }

      await sharedPreferences.setString('auth_token', token);
      await sharedPreferences.setString('user_data', jsonEncode(response.data['user']));

      return user;
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<void> updateFcmToken(String fcmToken) async {
    try {
      await apiClient.dio.post('/notifications/fcm-token', data: {'fcmToken': fcmToken});
    } on DioException catch (e) {
      log('Failed to update FCM token: ${e.message}');
    }
  }

  @override
  Future<void> removeFcmToken() async {
    try {
      await apiClient.dio.delete('/notifications/fcm-token');
    } on DioException catch (e) {
      log('Failed to remove FCM token: ${e.message}');
    }
  }
}
