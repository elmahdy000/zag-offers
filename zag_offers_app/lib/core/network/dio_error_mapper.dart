import 'package:dio/dio.dart';

String mapDioErrorToMessage(
  DioException error, {
  String fallbackMessage = 'عفوًا، حدث خطأ غير متوقع',
}) {
  final responseData = error.response?.data;
  if (responseData is Map<String, dynamic>) {
    final serverMessage = responseData['message']?.toString();
    if (serverMessage != null && serverMessage.isNotEmpty) {
      return serverMessage;
    }
  }

  switch (error.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
      return 'تعذر الاتصال بالسيرفر حاليًا. تأكد أن الباك إند شغال وأن الجهازين على نفس الشبكة.';
    case DioExceptionType.connectionError:
      return 'لا يمكن الوصول إلى السيرفر. تأكد من عنوان الـ IP وتشغيل الباك إند.';
    case DioExceptionType.badCertificate:
      return 'هناك مشكلة في شهادة الاتصال بالسيرفر.';
    case DioExceptionType.cancel:
      return 'تم إلغاء الطلب قبل اكتماله.';
    case DioExceptionType.badResponse:
      final statusCode = error.response?.statusCode;
      if (statusCode == 401) return 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى';
      if (statusCode == 403) return 'ليس لديك صلاحية لهذا الإجراء';
      if (statusCode == 404) return 'العنصر المطلوب غير موجود';
      if (statusCode != null && statusCode >= 500) return 'حدث خطأ في السيرفر، حاول مرة أخرى لاحقًا';
      return fallbackMessage;
    case DioExceptionType.unknown:
      return 'حدثت مشكلة في الشبكة. حاول مرة أخرى بعد التأكد من الاتصال.';
  }
}
