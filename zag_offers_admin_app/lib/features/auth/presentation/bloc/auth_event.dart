part of 'auth_bloc.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object> get props => [];
}

class LoginEvent extends AuthEvent {
  final String phone;
  final String password;

  const LoginEvent({required this.phone, required this.password});

  @override
  List<Object> get props => [phone, password];
}

class CheckAuthEvent extends AuthEvent {}

class LogoutEvent extends AuthEvent {}

class UpdateProfileEvent extends AuthEvent {
  final String name;
  final String area;

  const UpdateProfileEvent({required this.name, required this.area});

  @override
  List<Object> get props => [name, area];
}

class UpdatePasswordEvent extends AuthEvent {
  final String currentPassword;
  final String newPassword;

  const UpdatePasswordEvent({
    required this.currentPassword,
    required this.newPassword,
  });

  @override
  List<Object> get props => [currentPassword, newPassword];
}
