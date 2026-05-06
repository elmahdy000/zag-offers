import 'dart:convert';
import 'dart:developer';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../../core/network/api_client.dart';
import '../models/user_model.dart';

abstract class AuthRemoteDataSource {
  Future<UserModel> login(String phone, String password);
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
  Future<UserModel> login(String phone, String password) async {
    try {
      final response = await apiClient.dio.post(
        '/auth/login',
        data: {'phone': phone, 'password': password},
      );

      final token = response.data['access_token'];
      final user = UserModel.fromJson(response.data['user']);

      if (user.role != 'MERCHANT' && user.role != 'ADMIN') {
        throw Exception('Not authorized as vendor.');
      }

      await sharedPreferences.setString('auth_token', token);
      await sharedPreferences.setString('user_data', jsonEncode(response.data['user']));

      return user;
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Invalid phone or password');
      }
      throw Exception(e.message);
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
