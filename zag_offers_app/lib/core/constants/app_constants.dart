class AppConstants {
  static const String appName = 'Zag Offers';

  /// عنوان الباك-إيند — يتغير حسب البيئة:
  ///   - جهاز حقيقي على نفس الشبكة: استخدم IP الجهاز اللي شغال عليه السيرفر
  ///     مثال: 'http://192.168.1.100:3001'
  ///   - Android Emulator (AVD): استخدم 'http://10.0.2.2:3001'
  ///   - iOS Simulator:          استخدم 'http://127.0.0.1:3001'
  ///   - Production:             استخدم 'https://api.zagoffers.com'
  ///
  /// الأفضل إنك تحط القيمة دي في --dart-define عند البناء:
  ///   flutter run --dart-define=BASE_URL=http://192.168.1.100:3001/api
  static const String baseUrl = String.fromEnvironment(
    'BASE_URL',
    defaultValue: 'http://192.168.1.18:3001/api',
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

  static const String mapsApiKey = String.fromEnvironment(
    'MAPS_API_KEY',
    defaultValue: '',
  );

  static const bool mapsEnabled = mapsApiKey != '';

  static const Duration couponExpiry = Duration(hours: 2);
  static const int defaultPageSize = 10;
}
