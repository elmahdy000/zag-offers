import 'package:equatable/equatable.dart';

class UserEntity extends Equatable {
  final String id;
  final String? phone;   // اختياري — مستخدمو Google/Facebook ممكن مالهمش رقم
  final String? email;
  final String name;
  final String role;
  final String? area;
  final String? avatar;
  final int points;
  final String tier;
  final String? referralCode;
  final String? token;   // JWT — بيتحفظ في SharedPreferences بعد الـ Login

  const UserEntity({
    required this.id,
    this.phone,
    this.email,
    required this.name,
    required this.role,
    this.area,
    this.avatar,
    this.points = 0,
    this.tier = 'BRONZE',
    this.referralCode,
    this.token,
  });

  @override
  List<Object?> get props => [id, phone, email, name, role, area, avatar, points, tier, referralCode, token];
}
