import '../constants/app_constants.dart';

class ImageUrlHelper {
  ImageUrlHelper._();

  static String resolve(String url) {
    final trimmed = url.trim();
    if (trimmed.isEmpty) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    
    final base = AppConstants.socketUrl.endsWith('/')
        ? AppConstants.socketUrl.substring(0, AppConstants.socketUrl.length - 1)
        : AppConstants.socketUrl;

    String cleanPath = trimmed;
    // إذا كان المسار لا يبدأ بـ /uploads/ وهو مسار محلي، نضيفه
    if (!cleanPath.startsWith('/uploads/') && !cleanPath.startsWith('uploads/')) {
      cleanPath = cleanPath.startsWith('/') ? '/uploads$cleanPath' : '/uploads/$cleanPath';
    } else {
      // التأكد من وجود شرطة مائلة واحدة في البداية
      cleanPath = cleanPath.startsWith('/') ? cleanPath : '/$cleanPath';
    }

    return '$base$cleanPath';
  }

  static String? resolveNullable(String? url) {
    if (url == null || url.trim().isEmpty) return null;
    return resolve(url);
  }
}
