import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../models/user_model.dart';

abstract class AuthRemoteDataSource {
  Future<UserModel> login(String identifier, String password);
  Future<UserModel> register(String phone, String password, String name, String? area, String? email);
  Future<void> updateFcmToken(String token);
  Future<void> forgotPassword(String email);
  Future<void> resetPassword(String email, String otp, String newPassword);
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient apiClient;

  AuthRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<void> updateFcmToken(String token) async {
    try {
      await apiClient.dio.post('/notifications/fcm-token', data: {
        'fcmToken': token,
      });
    } catch (e) {
      // Silent fail
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
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'فشل تسجيل الدخول');
    } catch (e) {
      throw Exception('حدث خطأ غير متوقع');
    }
  }

  @override
  Future<UserModel> register(String phone, String password, String name, String? area, String? email) async {
    try {
      final response = await apiClient.dio.post('/auth/register', data: {
        'phone': phone,
        'password': password,
        'name': name,
        'area': area,
        'email': email,
      });
      return UserModel.fromJson(response.data);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'فشل إنشاء الحساب');
    } catch (e) {
      throw Exception('حدث خطأ غير متوقع');
    }
  }

  @override
  Future<void> forgotPassword(String email) async {
    try {
      await apiClient.dio.post('/auth/forgot-password', data: {
        'email': email,
      });
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'فشل إرسال كود الاستعادة');
    } catch (e) {
      throw Exception('حدث خطأ غير متوقع');
    }
  }

  @override
  Future<void> resetPassword(String email, String otp, String newPassword) async {
    try {
      await apiClient.dio.post('/auth/reset-password', data: {
        'email': email,
        'otp': otp,
        'newPassword': newPassword,
      });
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'فشل إعادة تعيين كلمة السر');
    } catch (e) {
      throw Exception('حدث خطأ غير متوقع');
    }
  }
}
