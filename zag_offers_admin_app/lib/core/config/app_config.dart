/// Central app configuration.
///
/// Override at build time with --dart-define flags, e.g.:
///   flutter run --dart-define=API_BASE_URL=https://api.zagoffers.com/api
class AppConfig {
  AppConfig._();

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3001/api',
  );

  /// Base URL without the /api suffix — used for socket.io and resolving
  /// relative image paths like /uploads/filename.webp
  static String get socketUrl {
    const configured = String.fromEnvironment('SOCKET_URL');
    if (configured.isNotEmpty) return configured;
    return baseUrl.endsWith('/api')
        ? baseUrl.substring(0, baseUrl.length - 4)
        : baseUrl;
  }
}
