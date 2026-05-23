import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/utils/image_url_helper.dart';
import '../models/user_model.dart';

abstract class AuthRemoteDataSource {
  Future<UserModel> login(String identifier, String password);
  Future<UserModel> register(String phone, String password, String name, String? area, String? email, [String? referralCode]);
  Future<void> updateFcmToken(String token);
  Future<void> forgotPassword(String email);
  Future<void> resetPassword(String email, String otp, String newPassword);
  Future<void> deleteAccount();
  Future<String> uploadAvatar(String filePath);
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient apiClient;

  AuthRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<String> uploadAvatar(String filePath) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath, filename: 'avatar.jpg'),
      });
      final uploadResponse = await apiClient.dio.post('/upload', data: formData);
      final rawUrl = uploadResponse.data['url'] as String;
      final resolvedUrl = ImageUrlHelper.resolve(rawUrl);
      await apiClient.dio.patch('/auth/profile', data: {
        'avatar': rawUrl,
      });
      return resolvedUrl;
    } on DioException { rethrow; }
  }

  @override
  Future<void> updateFcmToken(String token) async {
    try {
      await apiClient.dio.post('/auth/fcm-token', data: {'token': token});
    } catch (e) {
      debugPrint('updateFcmToken failed: $e');
    }
  }

  @override
  Future<UserModel> login(String identifier, String password) async {
    try {
      final response = await apiClient.dio.post('/auth/login', data: {
        'phone': identifier, // الباك-إيند بيفهم إن ده ممكن يكون موبايل أو إيميل
        'password': password,
      });
      return UserModel.fromLoginJson(response.data);
    } on DioException { rethrow; }
  }

  @override
  Future<UserModel> register(String phone, String password, String name, String? area, String? email, [String? referralCode]) async {
    try {
      final response = await apiClient.dio.post('/auth/register', data: {
        'phone': phone,
        'password': password,
        'name': name,
        'area': area,
        'email': email,
        if (referralCode != null && referralCode.isNotEmpty) 'referredByCode': referralCode,
      });
      return UserModel.fromJson(response.data);
    } on DioException { rethrow; }
  }

  @override
  Future<void> forgotPassword(String email) async {
    try {
      await apiClient.dio.post('/auth/forgot-password', data: {
        'email': email,
      });
    } on DioException { rethrow; }
  }

  @override
  Future<void> resetPassword(String email, String otp, String newPassword) async {
    try {
      await apiClient.dio.post('/auth/reset-password', data: {
        'email': email,
        'otp': otp,
        'newPassword': newPassword,
      });
    } on DioException { rethrow; }
  }

  @override
  Future<void> deleteAccount() async {
    try {
      await apiClient.dio.delete('/users/profile');
    } on DioException { rethrow; }
  }
}

