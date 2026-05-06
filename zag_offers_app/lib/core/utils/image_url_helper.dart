import '../constants/app_constants.dart';

/// Resolves an image URL that may be absolute or relative.
///
/// Backend upload returns relative paths like `/uploads/filename.webp`.
/// The vendor app stores them as absolute URLs, but this helper ensures
/// that any relative path that reaches the user app is also handled correctly.
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
    final path = trimmed.startsWith('/') ? trimmed : '/$trimmed';
    return '$base$path';
  }

  /// Returns null if [url] is null or empty.
  static String? resolveNullable(String? url) {
    if (url == null || url.trim().isEmpty) return null;
    return resolve(url);
  }

  /// Resolves a list of image URLs.
  static List<String> resolveList(List<String>? urls) {
    if (urls == null || urls.isEmpty) return [];
    return urls.map(resolve).toList();
  }
}
