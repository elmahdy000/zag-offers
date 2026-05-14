import 'package:dio/dio.dart';

class ErrorHandler {
  static String handle(dynamic error) {
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return 'انتهت مهلة الاتصال بالخادم. تأكد من اتصالك بالإنترنت.';
        case DioExceptionType.badResponse:
          final response = error.response;
          if (response != null) {
            final data = response.data;
            if (data is Map && data.containsKey('message')) {
              final message = data['message'];
              if (message is List) return message.first.toString();
              return message.toString();
            }
            switch (response.statusCode) {
              case 400: return 'طلب غير صالح.';
              case 401: return 'بيانات الدخول غير صحيحة أو انتهت الجلسة.';
              case 403: return 'ليس لديك صلاحية للقيام بهذا الإجراء.';
              case 404: return 'العنصر المطلوب غير موجود (404).';
              case 500: return 'خطأ داخلي في الخادم. حاول لاحقاً.';
            }
          }
          return 'فشل الاتصال بالخادم (${error.response?.statusCode}).';
        case DioExceptionType.cancel:
          return 'تم إلغاء الطلب.';
        case DioExceptionType.connectionError:
          return 'لا يوجد اتصال بالإنترنت أو الخادم غير متاح حالياً.';
        default:
          return 'حدث خطأ غير متوقع. حاول مرة أخرى.';
      }
    }
    return error.toString();
  }
}
