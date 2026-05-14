import 'package:equatable/equatable.dart';
import '../../../../core/network/dio_error_mapper.dart';
import 'package:dio/dio.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/usecases/login_usecase.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../data/datasources/auth_remote_data_source.dart';
import '../../../../core/network/notification_service.dart';

// --- Events ---
abstract class AuthEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class LoginRequested extends AuthEvent {
  final String identifier;
  final String password;

  LoginRequested({required this.identifier, required this.password});

  @override
  List<Object?> get props => [identifier, password];
}

class CheckAuthStatus extends AuthEvent {}

class LogoutRequested extends AuthEvent {}

// --- States ---
abstract class AuthState extends Equatable {
  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class AuthAuthenticated extends AuthState {
  final UserEntity user;
  AuthAuthenticated(this.user);
  @override
  List<Object?> get props => [user];
}

class AuthUnauthenticated extends AuthState {}

class AuthError extends AuthState {
  final String message;
  AuthError(this.message);
  @override
  List<Object?> get props => [message];
}

// --- BLoC ---
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final LoginUseCase loginUseCase;
  final AuthRepository authRepository;

  AuthBloc({required this.loginUseCase, required this.authRepository})
      : super(AuthInitial()) {
    on<LoginRequested>(_onLoginRequested);
    on<CheckAuthStatus>(_onCheckAuthStatus);
    on<LogoutRequested>(_onLogoutRequested);
  }

  Future<void> _onLoginRequested(
    LoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final user = await loginUseCase(
        LoginParams(identifier: event.identifier, password: event.password),
      );
      // Register FCM token with backend now that the user is authenticated
      await NotificationService.sendTokenToBackend();
      emit(AuthAuthenticated(user));
    } on DioException catch (e) {
      emit(AuthError(mapDioErrorToMessage(e, fallbackMessage: 'فشل تسجيل الدخول')));
    } catch (e) {
      emit(AuthError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onCheckAuthStatus(
    CheckAuthStatus event,
    Emitter<AuthState> emit,
  ) async {
    // Add a small delay to show the splash screen and avoid flicker
    await Future.delayed(const Duration(milliseconds: 1500));
    final user = await authRepository.checkAuthStatus();
    if (user != null) {
      emit(AuthAuthenticated(user));
    } else {
      emit(AuthUnauthenticated());
    }
  }

  Future<void> _onLogoutRequested(
    LogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    // Remove FCM token from backend before clearing local auth
    await NotificationService.removeTokenFromBackend();
    await authRepository.logout();
    emit(AuthUnauthenticated());
  }
}
