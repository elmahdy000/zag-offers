import 'package:equatable/equatable.dart';

class UserModel extends Equatable {
  final String id;
  final String email;
  final String name;
  final String role;
  final String? phone;

  const UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.phone,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      role: json['role']?.toString() ?? 'MERCHANT',
      phone: json['phone']?.toString(),
    );
  }

  @override
  List<Object?> get props => [id, email, name, role, phone];
}
