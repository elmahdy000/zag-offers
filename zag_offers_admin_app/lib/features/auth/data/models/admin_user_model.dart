import 'package:zag_offers_admin_app/features/auth/domain/entities/admin_user.dart';

class AdminUserModel extends AdminUser {
  const AdminUserModel({
    required super.id,
    required super.name,
    required super.phone,
    required super.role,
    super.email,
  });

  factory AdminUserModel.fromJson(Map<String, dynamic> json) {
    return AdminUserModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      // Missing roles must fail closed; authentication explicitly requires ADMIN.
      role: json['role']?.toString() ?? '',
      email: json['email']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'role': role,
      'email': email,
    };
  }
}
