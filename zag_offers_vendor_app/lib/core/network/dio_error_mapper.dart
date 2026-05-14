import 'package:dio/dio.dart';

String mapDioErrorToMessage(
  DioException error, {
  String fallbackMessage = 'عفوًا، حدث خطأ غير متوقع',
}) {
  final responseData = error.response?.data;
  if (responseData is Map<String, dynamic>) {
    // If server provides an array of messages (validation errors)
    final serverMessage = responseData['message'];
    if (serverMessage is List) {
      return serverMessage.join('\n');
    }
    if (serverMessage != null && serverMessage.toString().isNotEmpty) {
      return serverMessage.toString();
    }
  }

  switch (error.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
      return 'تعذر الاتصال بالسيرفر. تأكد من اتصال الإنترنت.';
    case DioExceptionType.connectionError:
      return 'لا يمكن الوصول إلى السيرفر. تأكد من تشغيل الخدمة.';
    case DioExceptionType.badCertificate:
      return 'مشكلة في أمان الاتصال.';
    case DioExceptionType.cancel:
      return 'تم إلغاء العملية.';
    case DioExceptionType.badResponse:
      if (error.response?.statusCode == 401) {
        return 'بيانات الدخول غير صحيحة';
      }
      if (error.response?.statusCode == 403) {
        return 'ليس لديك صلاحية للقيام بهذا الإجراء';
      }
      return fallbackMessage;
    case DioExceptionType.unknown:
      return 'حدث خطأ في الاتصال بالشبكة.';
  }
}
