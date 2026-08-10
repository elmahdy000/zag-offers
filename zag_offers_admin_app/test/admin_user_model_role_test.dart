import 'package:flutter_test/flutter_test.dart';
import 'package:zag_offers_admin_app/features/auth/data/models/admin_user_model.dart';

void main() {
  test('missing role does not default to admin', () {
    final user = AdminUserModel.fromJson(const {
      'id': 'user-1',
      'name': 'User',
      'phone': '01000000000',
    });

    expect(user.role, isEmpty);
  });

  test('admin role is preserved', () {
    final user = AdminUserModel.fromJson(const {
      'id': 'admin-1',
      'name': 'Admin',
      'phone': '01000000000',
      'role': 'ADMIN',
    });

    expect(user.role, 'ADMIN');
  });
}
