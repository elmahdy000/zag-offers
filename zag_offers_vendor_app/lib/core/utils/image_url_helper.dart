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

    if (trimmed.startsWith('/')) {
      return '$base$trimmed';
    }

    if (trimmed.startsWith('uploads/')) {
      return '$base/$trimmed';
    }

    if (trimmed.contains('/')) {
      return '$base/$trimmed';
    }

    return '$base/uploads/$trimmed';
  }

  static String? resolveNullable(String? url) {
    if (url == null || url.trim().isEmpty) return null;
    return resolve(url);
  }
}
