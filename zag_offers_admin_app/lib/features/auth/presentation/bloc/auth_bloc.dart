import 'package:equatable/equatable.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:zag_offers_admin_app/features/auth/domain/entities/admin_user.dart';
import 'package:zag_offers_admin_app/features/auth/domain/repositories/auth_repository.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository repository;

  AuthBloc({required this.repository}) : super(AuthInitial()) {
    on<LoginEvent>((event, emit) async {
      emit(AuthLoading());
      final result = await repository.login(event.identifier, event.password);
      result.fold(
        (failure) => emit(AuthError(message: failure.message)),
        (user) => emit(AuthAuthenticated(user: user)),
      );
    });

    on<CheckAuthEvent>((event, emit) async {
      try {
        final result = await repository.getProfile().timeout(
          const Duration(seconds: 3),
        );
        result.fold(
          (failure) {
            debugPrint('Auth check failed: ${failure.message}');
            emit(AuthUnauthenticated());
          },
          (user) {
            debugPrint('Auth check success: ${user.name}');
            emit(AuthAuthenticated(user: user));
          },
        );
      } catch (e) {
        debugPrint('Auth check exception: $e');
        emit(AuthUnauthenticated());
      }
    });

    on<LogoutEvent>((event, emit) async {
      await repository.logout();
      emit(AuthUnauthenticated());
    });

    on<UpdateProfileEvent>((event, emit) async {
      emit(AuthLoading());
      final result = await repository.updateProfile(event.name, event.area);
      result.fold(
        (failure) => emit(AuthError(message: failure.message)),
        (user) => emit(AuthAuthenticated(user: user)),
      );
    });

    on<UpdatePasswordEvent>((event, emit) async {
      emit(AuthLoading());
      final result = await repository.updatePassword(
        event.currentPassword,
        event.newPassword,
      );
      result.fold(
        (failure) => emit(AuthError(message: failure.message)),
        (_) => add(CheckAuthEvent()), // Refresh profile
      );
    });
  }
}
