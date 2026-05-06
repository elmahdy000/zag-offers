import 'package:flutter_test/flutter_test.dart';
import 'package:zag_offers_app/core/constants/app_constants.dart';

void main() {
  test('backend URLs are configured', () {
    expect(AppConstants.baseUrl, isNotEmpty);
    expect(AppConstants.socketUrl, isNotEmpty);
  });
}
