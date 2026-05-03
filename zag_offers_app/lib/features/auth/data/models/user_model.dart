import '../../domain/entities/user_entity.dart';

class UserModel extends UserEntity {
  const UserModel({
    required super.id,
    super.phone,
    super.email,
    required super.name,
    required super.role,
    super.area,
    super.avatar,
    super.token,
  });

  /// للـ Register: الباك-إيند بيرجع User object مباشرة بدون token
  /// { id, name, phone, email, role, area, avatar, ... }
  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      phone: json['phone'],
      email: json['email'],
      name: json['name'] ?? 'مستخدم',
      role: json['role'] ?? 'CUSTOMER',
      area: json['area'],
      avatar: json['avatar'],
      token: json['access_token'], // موجود في حالة register بعض الأحيان
    );
  }

  /// للـ Login: الباك-إيند بيرجع { access_token, user: { ... } }
  factory UserModel.fromLoginJson(Map<String, dynamic> json) {
    final userMap = json['user'] as Map<String, dynamic>? ?? {};
    return UserModel(
      id: userMap['id']?.toString() ?? '',
      phone: userMap['phone'],
      email: userMap['email'],
      name: userMap['name'] ?? 'مستخدم',
      role: userMap['role'] ?? 'CUSTOMER',
      area: userMap['area'],
      avatar: userMap['avatar'],
      token: json['access_token'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'phone': phone,
      'email': email,
      'name': name,
      'role': role,
      'area': area,
      'avatar': avatar,
      'access_token': token,
    };
  }
}
