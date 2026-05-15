import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object> get props => [];
}

class LoginSubmitted extends AuthEvent {
  final String identifier;
  final String password;

  const LoginSubmitted({required this.identifier, required this.password});

  @override
  List<Object> get props => [identifier, password];
}

class RegisterSubmitted extends AuthEvent {
  final String phone;
  final String password;
  final String name;
  final String? area;
  final String? email;

  const RegisterSubmitted({
    required this.phone,
    required this.password,
    required this.name,
    this.area,
    this.email,
  });

  @override
  List<Object> get props => [phone, password, name, area ?? '', email ?? ''];
}

class LogoutRequested extends AuthEvent {}
class DeleteAccountRequested extends AuthEvent {}

class ForgotPasswordRequested extends AuthEvent {
  final String email;
  const ForgotPasswordRequested(this.email);

  @override
  List<Object> get props => [email];
}

class ResetPasswordSubmitted extends AuthEvent {
  final String email;
  final String otp;
  final String newPassword;

  const ResetPasswordSubmitted({
    required this.email,
    required this.otp,
    required this.newPassword,
  });

  @override
  List<Object> get props => [email, otp, newPassword];
}

