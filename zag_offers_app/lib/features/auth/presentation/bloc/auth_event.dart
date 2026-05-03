import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object> get props => [];
}

class LoginSubmitted extends AuthEvent {
  final String phone;
  final String password;

  const LoginSubmitted({required this.phone, required this.password});

  @override
  List<Object> get props => [phone, password];
}

class RegisterSubmitted extends AuthEvent {
  final String phone;
  final String password;
  final String name;
  final String? area;

  const RegisterSubmitted({
    required this.phone,
    required this.password,
    required this.name,
    this.area,
  });

  @override
  List<Object> get props => [phone, password, name, area ?? ''];
}

class LogoutRequested extends AuthEvent {}

