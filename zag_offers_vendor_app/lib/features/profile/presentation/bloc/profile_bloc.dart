import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:zag_offers_vendor_app/core/usecases/usecase.dart';
import 'package:zag_offers_vendor_app/features/auth/domain/entities/user_entity.dart';
import 'package:zag_offers_vendor_app/features/profile/domain/usecases/profile_usecases.dart';

// --- Events ---
abstract class ProfileEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class GetProfileRequested extends ProfileEvent {}

class UpdateProfileRequested extends ProfileEvent {
  final String? name;
  final String? phone;
  UpdateProfileRequested({this.name, this.phone});
  @override
  List<Object?> get props => [name, phone];
}

class ChangePasswordRequested extends ProfileEvent {
  final String currentPassword;
  final String newPassword;
  ChangePasswordRequested({
    required this.currentPassword,
    required this.newPassword,
  });
  @override
  List<Object?> get props => [currentPassword, newPassword];
}

class DeleteAccountRequested extends ProfileEvent {}

// --- States ---
abstract class ProfileState extends Equatable {
  @override
  List<Object?> get props => [];
}

class ProfileInitial extends ProfileState {}

class ProfileLoading extends ProfileState {}

class ProfileLoaded extends ProfileState {
  final UserEntity user;
  ProfileLoaded(this.user);
  @override
  List<Object?> get props => [user];
}

class ProfileError extends ProfileState {
  final String message;
  ProfileError(this.message);
  @override
  List<Object?> get props => [message];
}

class PasswordChanging extends ProfileState {
  final UserEntity user;
  PasswordChanging(this.user);
  @override
  List<Object?> get props => [user];
}

class PasswordChanged extends ProfileState {
  final UserEntity user;
  PasswordChanged(this.user);
  @override
  List<Object?> get props => [user];
}

class PasswordChangeError extends ProfileState {
  final UserEntity user;
  final String message;
  PasswordChangeError(this.user, this.message);
  @override
  List<Object?> get props => [user, message];
}

class AccountDeleting extends ProfileState {
  final UserEntity user;
  AccountDeleting(this.user);
  @override
  List<Object?> get props => [user];
}

class AccountDeleted extends ProfileState {}

class AccountDeleteError extends ProfileState {
  final UserEntity user;
  final String message;
  AccountDeleteError(this.user, this.message);
  @override
  List<Object?> get props => [user, message];
}

// --- BLoC ---
class ProfileBloc extends Bloc<ProfileEvent, ProfileState> {
  final GetProfileUseCase getProfileUseCase;
  final UpdateProfileUseCase updateProfileUseCase;
  final ChangePasswordUseCase changePasswordUseCase;
  final DeleteAccountUseCase deleteAccountUseCase;

  ProfileBloc({
    required this.getProfileUseCase,
    required this.updateProfileUseCase,
    required this.changePasswordUseCase,
    required this.deleteAccountUseCase,
  }) : super(ProfileInitial()) {
    on<GetProfileRequested>(_onGetProfileRequested);
    on<UpdateProfileRequested>(_onUpdateProfileRequested);
    on<ChangePasswordRequested>(_onChangePasswordRequested);
    on<DeleteAccountRequested>(_onDeleteAccountRequested);
  }

  Future<void> _onGetProfileRequested(
    GetProfileRequested event,
    Emitter<ProfileState> emit,
  ) async {
    emit(ProfileLoading());
    try {
      final user = await getProfileUseCase(NoParams());
      emit(ProfileLoaded(user));
    } catch (e) {
      emit(ProfileError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onUpdateProfileRequested(
    UpdateProfileRequested event,
    Emitter<ProfileState> emit,
  ) async {
    emit(ProfileLoading());
    try {
      final user = await updateProfileUseCase(
        UpdateProfileParams(name: event.name, phone: event.phone),
      );
      emit(ProfileLoaded(user));
    } catch (e) {
      emit(ProfileError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onChangePasswordRequested(
    ChangePasswordRequested event,
    Emitter<ProfileState> emit,
  ) async {
    // Keep current user visible while changing password
    final currentUser = state is ProfileLoaded
        ? (state as ProfileLoaded).user
        : state is PasswordChanged
        ? (state as PasswordChanged).user
        : state is PasswordChangeError
        ? (state as PasswordChangeError).user
        : null;
    if (currentUser == null) return;

    emit(PasswordChanging(currentUser));
    try {
      await changePasswordUseCase(
        ChangePasswordParams(
          currentPassword: event.currentPassword,
          newPassword: event.newPassword,
        ),
      );
      emit(PasswordChanged(currentUser));
    } catch (e) {
      emit(
        PasswordChangeError(
          currentUser,
          e.toString().replaceAll('Exception: ', ''),
        ),
      );
    }
  }

  Future<void> _onDeleteAccountRequested(
    DeleteAccountRequested event,
    Emitter<ProfileState> emit,
  ) async {
    final currentUser = state is ProfileLoaded
        ? (state as ProfileLoaded).user
        : state is AccountDeleteError
        ? (state as AccountDeleteError).user
        : null;
    if (currentUser == null) return;

    emit(AccountDeleting(currentUser));
    try {
      await deleteAccountUseCase(NoParams());
      emit(AccountDeleted());
    } catch (e) {
      emit(
        AccountDeleteError(
          currentUser,
          e.toString().replaceAll('Exception: ', ''),
        ),
      );
    }
  }
}
