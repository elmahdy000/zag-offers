part of 'users_bloc.dart';

abstract class UsersState extends Equatable {
  const UsersState();

  @override
  List<Object?> get props => [];
}

class UsersInitial extends UsersState {}

class UsersLoading extends UsersState {}

class UsersLoaded extends UsersState {
  final List<AppUser> users;
  const UsersLoaded({required this.users});

  @override
  List<Object?> get props => [users];
}

class UserDeleted extends UsersState {}

class UsersError extends UsersState {
  final String message;
  const UsersError({required this.message});

  @override
  List<Object?> get props => [message];
}
