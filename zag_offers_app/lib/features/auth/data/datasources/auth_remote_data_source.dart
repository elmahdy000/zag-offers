import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../models/user_model.dart';

abstract class AuthRemoteDataSource {
  Future<UserModel> login(String phone, String password);
  Future<UserModel> register(String phone, String password, String name, String? area);
  Future<void> updateFcmToken(String token);
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
      // الصمت في حالة فشل تحديث التوكن لعدم مقاطعة تجربة المستخدم
    }
  }

  @override
  Future<UserModel> login(String phone, String password) async {
    try {
      final response = await apiClient.dio.post('/auth/login', data: {
        'phone': phone,
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
  Future<UserModel> register(String phone, String password, String name, String? area) async {
    try {
      final response = await apiClient.dio.post('/auth/register', data: {
        'phone': phone,
        'password': password,
        'name': name,
        'area': area,
      });
      return UserModel.fromJson(response.data);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'فشل إنشاء الحساب');
    } catch (e) {
      throw Exception('حدث خطأ غير متوقع');
    }
  }
}
