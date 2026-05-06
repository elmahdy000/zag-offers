import '../config/app_config.dart';

/// Resolves an image URL that may be absolute or relative.
class ImageUrlHelper {
  ImageUrlHelper._();

  static String resolve(String url) {
    final trimmed = url.trim();
    if (trimmed.isEmpty) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    final base = AppConfig.socketUrl.endsWith('/')
        ? AppConfig.socketUrl.substring(0, AppConfig.socketUrl.length - 1)
        : AppConfig.socketUrl;
    final path = trimmed.startsWith('/') ? trimmed : '/$trimmed';
    return '$base$path';
  }

  static String? resolveNullable(String? url) {
    if (url == null || url.trim().isEmpty) return null;
    return resolve(url);
  }

  static List<String> resolveList(List<String>? urls) {
    if (urls == null || urls.isEmpty) return [];
    return urls.map(resolve).toList();
  }
}
