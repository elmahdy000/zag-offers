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
  final int totalCount;
  const UsersLoaded({required this.users, required this.totalCount});

  @override
  List<Object?> get props => [users, totalCount];
}

class UserDeleted extends UsersState {}

class UsersError extends UsersState {
  final String message;
  const UsersError({required this.message});

  @override
  List<Object?> get props => [message];
}
