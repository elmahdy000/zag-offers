import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';
import '../utils/crypto_utils.dart';

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
    return await dio.post('/api/auth/vendor/login', data: data);
  }

  Future<Response> register(Map<String, dynamic> data) async {
    return await dio.post('/api/auth/vendor/register', data: data);
  }

  Future<Response> refreshToken() async {
    return await dio.post('/api/auth/refresh');
  }

  // Dashboard endpoints (React app compatibility)
  Future<Response> getDashboardStats() async {
    return await dio.get('/api/vendor/dashboard/stats');
  }

  Future<Response> getVendorOffers() async {
    return await dio.get('/api/vendor/offers');
  }

  Future<Response> getVendorCoupons() async {
    return await dio.get('/api/vendor/coupons');
  }

  // Offers endpoints (React app compatibility)
  Future<Response> createOffer(Map<String, dynamic> data) async {
    return await dio.post('/api/vendor/offers', data: data);
  }

  Future<Response> updateOffer(String id, Map<String, dynamic> data) async {
    return await dio.put('/api/vendor/offers/$id', data: data);
  }

  Future<Response> deleteOffer(String id) async {
    return await dio.delete('/api/vendor/offers/$id');
  }

  Future<Response> getOffer(String id) async {
    return await dio.get('/api/vendor/offers/$id');
  }

  // Store endpoints (React app compatibility)
  Future<Response> getVendorStore() async {
    return await dio.get('/api/vendor/store');
  }

  Future<Response> updateStore(Map<String, dynamic> data) async {
    return await dio.put('/api/vendor/store', data: data);
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
    return await dio.get('/api/notifications');
  }

  Future<Response> markAllNotificationsRead() async {
    return await dio.post('/api/notifications/read-all');
  }

  // QR Scanner endpoints (React app compatibility)
  Future<Response> validateCoupon(String code) async {
    return await dio.post('/api/vendor/validate-coupon', data: {'code': code});
  }

  Future<Response> redeemCoupon(String code) async {
    return await dio.post('/api/vendor/redeem-coupon', data: {'code': code});
  }

  // Security endpoints (React app compatibility)
  Future<Response> changePassword(Map<String, dynamic> data) async {
    return await dio.post('/api/vendor/change-password', data: data);
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
        // Parse user data to get store ID (React app compatibility)
        final userMap = userData.startsWith('{') ? 
          Map<String, dynamic>.fromEntries(
            userData.split(',').map((e) => MapEntry(e.split(':')[0].trim().replaceAll('{', '').replaceAll('"', ''), 
            e.split(':')[1].trim().replaceAll('}', '').replaceAll('"', '')))
          ) : null;
        return userMap?['storeId']?.toString();
      }
    } catch (e) {
      // Handle error silently
    }
    return null;
  }
}
