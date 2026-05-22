import '../constants/app_constants.dart';

class ImageUrlHelper {
  ImageUrlHelper._();

  static String _baseUrl() {
    final base = AppConstants.baseUrl;
    final stripped = base.endsWith('/api')
        ? base.substring(0, base.length - 4)
        : base;
    return stripped.endsWith('/')
        ? stripped.substring(0, stripped.length - 1)
        : stripped;
  }

  static String resolve(String url) {
    final trimmed = url.trim();
    if (trimmed.isEmpty) return '';

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    final base = _baseUrl();

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
