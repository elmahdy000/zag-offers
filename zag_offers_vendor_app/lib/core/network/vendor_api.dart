import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';
import 'dart:convert';

class VendorApi {
  late final Dio dio;
  static VendorApi? _instance;

  VendorApi._() {
    dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _getAuthToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          if (e.response?.statusCode == 401) {
            await _clearAuthData();
          }
          return handler.next(e);
        },
      ),
    );
  }

  static VendorApi get instance {
    _instance ??= VendorApi._();
    return _instance!;
  }

  Future<String?> _getAuthToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('auth_token');
    } catch (e) {
      return null;
    }
  }

  Future<void> _clearAuthData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('auth_token');
      await prefs.remove('user_data');
      await prefs.remove('vendor_user');
    } catch (e) {
      // Handle error silently
    }
  }

  // Auth endpoints (React app compatibility)
  Future<Response> login(Map<String, dynamic> data) async {
    return await dio.post('/auth/login', data: data);
  }

  Future<Response> register(Map<String, dynamic> data) async {
    return await dio.post('/auth/register', data: data);
  }

  Future<Response> refreshToken() async {
    return await dio.post('/auth/refresh');
  }

  // Dashboard endpoints (React app compatibility)
  Future<Response> getDashboardStats() async {
    return await dio.get('/stores/my-dashboard');
  }

  Future<Response> getVendorOffers() async {
    return await dio.get('/offers/my');
  }

  Future<Response> getVendorCoupons() async {
    return await dio.get('/coupons/merchant');
  }

  // Offers endpoints (React app compatibility)
  Future<Response> createOffer(Map<String, dynamic> data) async {
    return await dio.post('/offers', data: data);
  }

  Future<Response> updateOffer(String id, Map<String, dynamic> data) async {
    return await dio.patch('/offers/$id', data: data);
  }

  Future<Response> deleteOffer(String id) async {
    return await dio.delete('/offers/$id');
  }

  Future<Response> getOffer(String id) async {
    return await dio.get('/offers/$id');
  }

  // Store endpoints (React app compatibility)
  Future<Response> getVendorStore() async {
    return await dio.get('/stores/my');
  }

  Future<Response> updateStore(Map<String, dynamic> data) async {
    final storeId = await getVendorStoreId();
    if (storeId == null || storeId.isEmpty) {
      throw Exception('Store ID not found');
    }
    return await dio.patch('/stores/$storeId', data: data);
  }

  // File upload (React app compatibility)
  Future<Response> uploadFile(String filePath, String fileField) async {
    final formData = FormData.fromMap({
      fileField: await MultipartFile.fromFile(filePath),
    });
    return await dio.post('/upload', data: formData);
  }

  // Chat endpoints (React app compatibility)
  Future<Response> getChatConversations() async {
    return await dio.get('/chat/conversations');
  }

  Future<Response> startChat(Map<String, dynamic> data) async {
    return await dio.post('/chat/start', data: data);
  }

  Future<Response> getChatMessages(String conversationId) async {
    return await dio.get('/chat/messages/$conversationId');
  }

  Future<Response> sendChatMessage(Map<String, dynamic> data) async {
    return await dio.post('/chat/send', data: data);
  }

  // Notifications endpoints (React app compatibility)
  Future<Response> getNotifications() async {
    return await dio.get('/notifications');
  }

  Future<Response> markAllNotificationsRead() async {
    return await dio.post('/notifications/read-all');
  }

  // QR Scanner endpoints (React app compatibility)
  Future<Response> validateCoupon(String code) async {
    return await dio.get('/coupons/by-code/$code');
  }

  Future<Response> redeemCoupon(String code) async {
    return await dio.post('/coupons/redeem', data: {'code': code});
  }

  // Security endpoints (React app compatibility)
  Future<Response> changePassword(Map<String, dynamic> data) async {
    return await dio.post('/auth/password', data: data);
  }

  // Utility methods
  String resolveImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) {
      return '${AppConstants.baseUrl}/placeholder.jpg';
    }
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    return '${AppConstants.baseUrl}/$imagePath';
  }

  Future<String?> getVendorStoreId() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userData = prefs.getString('vendor_user') ?? prefs.getString('user_data');
      
      if (userData != null) {
        final decoded = jsonDecode(userData);
        if (decoded is Map<String, dynamic>) {
          return decoded['storeId']?.toString();
        }
      }
    } catch (e) {
      // Handle error silently
    }
    return null;
  }
}
