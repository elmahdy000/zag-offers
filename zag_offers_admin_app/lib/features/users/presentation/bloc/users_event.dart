part of 'users_bloc.dart';

abstract class UsersEvent extends Equatable {
  const UsersEvent();

  @override
  List<Object?> get props => [];
}

class LoadUsersEvent extends UsersEvent {
  final String? search;
  const LoadUsersEvent({this.search});

  @override
  List<Object?> get props => [search];
}

class DeleteUserEvent extends UsersEvent {
  final String id;
  const DeleteUserEvent({required this.id});

  @override
  List<Object?> get props => [id];
}

class UpdateUserEvent extends UsersEvent {
  final String id;
  final int? points;
  final String? role;

  const UpdateUserEvent({required this.id, this.points, this.role});

  @override
  List<Object?> get props => [id, points, role];
}
