import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/services/notification_service.dart';
import '../../domain/usecases/login_usecase.dart';
import '../../domain/usecases/logout_usecase.dart';
import '../../domain/usecases/register_usecase.dart';
import '../../domain/usecases/update_fcm_token_usecase.dart';
import '../../domain/usecases/forgot_password_usecase.dart';
import '../../domain/usecases/reset_password_usecase.dart';
import '../../domain/usecases/delete_account_usecase.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final LoginUseCase loginUseCase;
  final RegisterUseCase registerUseCase;
  final LogoutUseCase logoutUseCase;
  final UpdateFcmTokenUseCase updateFcmTokenUseCase;
  final ForgotPasswordUseCase forgotPasswordUseCase;
  final ResetPasswordUseCase resetPasswordUseCase;
  final DeleteAccountUseCase deleteAccountUseCase;

  AuthBloc({
    required this.loginUseCase,
    required this.registerUseCase,
    required this.logoutUseCase,
    required this.updateFcmTokenUseCase,
    required this.forgotPasswordUseCase,
    required this.resetPasswordUseCase,
    required this.deleteAccountUseCase,
  }) : super(AuthInitial()) {
    on<LoginSubmitted>(_onLoginSubmitted);
    on<RegisterSubmitted>(_onRegisterSubmitted);
    on<LogoutRequested>(_onLogoutRequested);
    on<DeleteAccountRequested>(_onDeleteAccountRequested);
    on<ForgotPasswordRequested>(_onForgotPasswordRequested);
    on<ResetPasswordSubmitted>(_onResetPasswordSubmitted);
  }

  Future<void> _onDeleteAccountRequested(
    DeleteAccountRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    // Remove FCM token from backend first
    await NotificationService.removeTokenFromBackend();
    final result = await deleteAccountUseCase();
    result.fold(
      (failure) => emit(AuthError(failure.message)),
      (_) => emit(AuthInitial()),
    );
  }

  Future<void> _onForgotPasswordRequested(
    ForgotPasswordRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    final result = await forgotPasswordUseCase(event.email);
    result.fold(
      (failure) => emit(AuthError(failure.message)),
      (_) => emit(ForgotPasswordSent()),
    );
  }

  Future<void> _onResetPasswordSubmitted(
    ResetPasswordSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    final result = await resetPasswordUseCase(
      email: event.email,
      otp: event.otp,
      newPassword: event.newPassword,
    );
    result.fold(
      (failure) => emit(AuthError(failure.message)),
      (_) => emit(ResetPasswordSuccess()),
    );
  }

  Future<void> _onLogoutRequested(
    LogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    // Remove FCM token from backend before clearing local auth
    await NotificationService.removeTokenFromBackend();
    await logoutUseCase();
    emit(AuthInitial());
  }

  Future<void> _onLoginSubmitted(
    LoginSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    final result = await loginUseCase(
      identifier: event.identifier,
      password: event.password,
    );

    await result.fold(
      (failure) async => emit(AuthError(failure.message)),
      (user) async {
        final token = await FirebaseMessaging.instance.getToken();
        if (token != null) {
          await updateFcmTokenUseCase(token);
        }

        NotificationService.subscribeToArea(user.area);
        emit(AuthSuccess(user));
      },
    );
  }

  Future<void> _onRegisterSubmitted(
    RegisterSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    final registerResult = await registerUseCase(
      phone: event.phone,
      password: event.password,
      name: event.name,
      area: event.area,
      email: event.email,
    );

    await registerResult.fold(
      (failure) async => emit(AuthError(failure.message)),
      (_) async {
        final loginResult = await loginUseCase(
          identifier: event.phone,
          password: event.password,
        );

        await loginResult.fold(
          (failure) async => emit(
            const AuthError(
              'تم إنشاء الحساب، لكن تعذر تسجيل الدخول تلقائيًا. جرّب تسجيل الدخول يدويًا.',
            ),
          ),
          (user) async {
            final token = await FirebaseMessaging.instance.getToken();
            if (token != null) {
              await updateFcmTokenUseCase(token);
            }

            NotificationService.subscribeToArea(user.area);
            emit(AuthSuccess(user));
          },
        );
      },
    );
  }
}
