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

// --- BLoC ---
class ProfileBloc extends Bloc<ProfileEvent, ProfileState> {
  final GetProfileUseCase getProfileUseCase;
  final UpdateProfileUseCase updateProfileUseCase;

  ProfileBloc({
    required this.getProfileUseCase,
    required this.updateProfileUseCase,
  }) : super(ProfileInitial()) {
    on<GetProfileRequested>(_onGetProfileRequested);
    on<UpdateProfileRequested>(_onUpdateProfileRequested);
  }

  Future<void> _onGetProfileRequested(
      GetProfileRequested event, Emitter<ProfileState> emit) async {
    emit(ProfileLoading());
    try {
      final user = await getProfileUseCase(NoParams());
      emit(ProfileLoaded(user));
    } catch (e) {
      emit(ProfileError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onUpdateProfileRequested(
      UpdateProfileRequested event, Emitter<ProfileState> emit) async {
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
}
