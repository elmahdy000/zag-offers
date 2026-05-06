import 'package:equatable/equatable.dart';

class AdminUser extends Equatable {
  final String id;
  final String name;
  final String phone;
  final String role;
  final String? email;

  const AdminUser({
    required this.id,
    required this.name,
    required this.phone,
    required this.role,
    this.email,
  });

  @override
  List<Object?> get props => [id, name, phone, role, email];
}
