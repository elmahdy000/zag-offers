import 'package:flutter_test/flutter_test.dart';
import 'package:zag_offers_admin_app/core/config/app_config.dart';

void main() {
  test('API base URL is configured', () {
    expect(AppConfig.baseUrl, isNotEmpty);
  });
}
