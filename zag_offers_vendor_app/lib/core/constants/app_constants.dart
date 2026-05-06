class AppConstants {
  static const String appName = 'Zag Offers - Vendor';

  static const String baseUrl = String.fromEnvironment(
    'BASE_URL',
    defaultValue: 'https://api.zagoffers.online/api',
  );

  static String get socketUrl {
    const configuredUrl = String.fromEnvironment('SOCKET_URL');
    if (configuredUrl.isNotEmpty) {
      return configuredUrl;
    }

    return baseUrl.endsWith('/api')
        ? baseUrl.substring(0, baseUrl.length - 4)
        : baseUrl;
  }
}
