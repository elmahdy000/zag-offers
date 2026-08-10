import 'package:flutter_test/flutter_test.dart';
import 'package:zag_offers_vendor_app/features/auth/data/models/user_model.dart';

void main() {
  test('missing role does not default to merchant', () {
    final user = UserModel.fromJson(const {
      'id': 'user-1',
      'email': 'user@example.com',
      'name': 'User',
    });

    expect(user.role, isEmpty);
  });

  test('merchant role is preserved', () {
    final user = UserModel.fromJson(const {
      'id': 'merchant-1',
      'email': 'merchant@example.com',
      'name': 'Merchant',
      'role': 'MERCHANT',
    });

    expect(user.role, 'MERCHANT');
  });
}
