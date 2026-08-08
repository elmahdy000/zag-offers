import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:zag_offers_admin_app/core/config/app_config.dart';
import 'package:zag_offers_admin_app/core/storage/token_storage.dart';

typedef UnauthorizedCallback = void Function();

class ApiClient {
  static UnauthorizedCallback? onUnauthorized;
  final Dio _dio;
  final TokenStorage _tokenStorage;
  String? _cachedToken;
  bool _tokenLoaded = false;

  ApiClient(this._dio, this._tokenStorage) {
    _dio.options.baseUrl = AppConfig.baseUrl.endsWith('/')
        ? AppConfig.baseUrl
        : '${AppConfig.baseUrl}/';
    _dio.options.connectTimeout = const Duration(seconds: 20);
    _dio.options.receiveTimeout = const Duration(seconds: 20);

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          if (!_tokenLoaded) {
            _cachedToken = await _tokenStorage.read();
            _tokenLoaded = true;
          }
          final token = _cachedToken;
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (e, handler) async {
          final hasRetried = e.requestOptions.extra['hasRetried'] == true;
          final isTimeout = e.type == DioExceptionType.connectionTimeout;
          final isSocketError = e.type == DioExceptionType.connectionError;

          // Retry once for transient network issues before surfacing the error.
          if (!hasRetried && (isTimeout || isSocketError)) {
            final retriedRequest = e.requestOptions.copyWith(
              extra: {...e.requestOptions.extra, 'hasRetried': true},
            );
            Future<void>.delayed(const Duration(milliseconds: 350), () async {
              try {
                final response = await _dio.fetch(retriedRequest);
                handler.resolve(response);
              } catch (retryError) {
                if (retryError is DioException) {
                  handler.next(retryError);
                } else {
                  handler.next(
                    DioException(
                      requestOptions: retriedRequest,
                      error: retryError,
                    ),
                  );
                }
              }
            });
            return;
          }

          if (e.response?.statusCode == 401) {
            final hadSession = _cachedToken != null;
            await _tokenStorage.clear();
            setAuthToken(null);
            if (hadSession) onUnauthorized?.call();
          }
          return handler.next(e);
        },
      ),
    );

    if (kDebugMode) {
      _dio.interceptors.add(
        LogInterceptor(
          requestHeader: false,
          requestBody: false,
          responseHeader: false,
          responseBody: false,
          error: true,
        ),
      );
    }
  }

  void setAuthToken(String? token) {
    _cachedToken = token;
    _tokenLoaded = true;
  }

  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    final cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return _dio.get(
      cleanPath,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response> post(String path, {dynamic data, Options? options}) {
    final cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return _dio.post(cleanPath, data: data, options: options);
  }

  Future<Response> patch(String path, {dynamic data, Options? options}) {
    final cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return _dio.patch(cleanPath, data: data, options: options);
  }

  Future<Response> put(String path, {dynamic data, Options? options}) {
    final cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return _dio.put(cleanPath, data: data, options: options);
  }

  Future<Response> delete(String path) {
    final cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return _dio.delete(cleanPath);
  }

  Future<Response> upload(String path, FormData data) {
    final cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return _dio.post(
      cleanPath,
      data: data,
      options: Options(contentType: 'multipart/form-data'),
    );
  }

  /// Lightweight connectivity probe — used by the Profile page health indicator.
  Future<bool> checkHealth() async {
    try {
      await get(
        'admin/stats/global',
        options: Options(
          sendTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ),
      );
      return true;
    } catch (_) {
      return false;
    }
  }
}
