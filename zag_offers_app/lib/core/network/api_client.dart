import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';

class ApiClient {
  final Dio dio;
  final SharedPreferences sharedPreferences;

  ApiClient({required this.dio, required this.sharedPreferences}) {
    dio.options.baseUrl = AppConstants.baseUrl;
    dio.options.connectTimeout = const Duration(seconds: 10);
    dio.options.receiveTimeout = const Duration(seconds: 15);
    dio.options.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Interceptor للـ JWT — يضيف التوكن لكل request تلقائياً
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = sharedPreferences.getString('auth_token');
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          // If server responds with 401 (token expired or revoked),
          // clean all cached session credentials so the user logs in fresh.
          if (error.response?.statusCode == 401) {
            await sharedPreferences.remove('auth_token');
            await sharedPreferences.remove('user_id');
            await sharedPreferences.remove('user_name');
            await sharedPreferences.remove('user_role');
            await sharedPreferences.remove('avatar_url');
            await sharedPreferences.remove('user_points');
            await sharedPreferences.remove('user_tier');
            await sharedPreferences.remove('referral_code');
          }
          return handler.next(error);
        },
      ),
    );

    // Logging interceptor — للتطوير فقط
    // في الـ Production يفضل تشيله أو تحطه conditioned
    assert(() {
      dio.interceptors.add(LogInterceptor(
        requestHeader: false,
        requestBody: true,
        responseHeader: false,
        responseBody: true,
        error: true,
      ));
      return true;
    }());
  }
}
