import 'package:equatable/equatable.dart';

class AppUser extends Equatable {
  final String id;
  final String name;
  final String phone;
  final String? email;
  final DateTime createdAt;
  final int points;

  const AppUser({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
    required this.createdAt,
    this.points = 0,
  });

  @override
  List<Object?> get props => [id, name, phone, email, createdAt, points];
}
