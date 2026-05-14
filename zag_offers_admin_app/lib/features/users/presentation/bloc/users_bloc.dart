import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:zag_offers_admin_app/features/users/domain/entities/app_user.dart';
import 'package:zag_offers_admin_app/features/users/domain/repositories/user_repository.dart';

part 'users_event.dart';
part 'users_state.dart';

class UsersBloc extends Bloc<UsersEvent, UsersState> {
  final UserRepository repository;

  UsersBloc({required this.repository}) : super(UsersInitial()) {
    on<LoadUsersEvent>((event, emit) async {
      emit(UsersLoading());
      final result = await repository.getUsers(search: event.search);
      result.fold(
        (failure) => emit(UsersError(message: failure.message)),
        (result) => emit(UsersLoaded(
          users: result.items,
          totalCount: result.total,
        )),
      );
    });

    on<DeleteUserEvent>((event, emit) async {
      final result = await repository.deleteUser(event.id);
      result.fold((failure) => emit(UsersError(message: failure.message)), (_) {
        emit(UserDeleted());
        add(LoadUsersEvent()); // Refresh
      });
    });

    on<UpdateUserEvent>((event, emit) async {
      final result = await repository.updateUser(
        event.id,
        points: event.points,
        role: event.role,
      );
      result.fold((failure) => emit(UsersError(message: failure.message)), (_) {
        add(LoadUsersEvent()); // Refresh
      });
    });
  }
}
