import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/offer_entity.dart';
import '../../domain/usecases/offer_usecases.dart';

// --- Events ---
abstract class OffersEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class GetMyOffersRequested extends OffersEvent {}

class CreateOfferRequested extends OffersEvent {
  final OfferEntity offer;
  CreateOfferRequested(this.offer);
  @override
  List<Object?> get props => [offer];
}

class UpdateOfferRequested extends OffersEvent {
  final OfferEntity offer;
  UpdateOfferRequested(this.offer);
  @override
  List<Object?> get props => [offer];
}

class DeleteOfferRequested extends OffersEvent {
  final String id;
  DeleteOfferRequested(this.id);
  @override
  List<Object?> get props => [id];
}

// --- States ---
abstract class OffersState extends Equatable {
  @override
  List<Object?> get props => [];
}

class OffersInitial extends OffersState {}

class OffersLoading extends OffersState {}

class OffersLoaded extends OffersState {
  final List<OfferEntity> offers;
  OffersLoaded(this.offers);
  @override
  List<Object?> get props => [offers];
}

class OfferActionSuccess extends OffersState {
  final String message;
  OfferActionSuccess(this.message);
  @override
  List<Object?> get props => [message];
}

class OffersError extends OffersState {
  final String message;
  OffersError(this.message);
  @override
  List<Object?> get props => [message];
}

// --- BLoC ---
class OffersBloc extends Bloc<OffersEvent, OffersState> {
  final GetMyOffersUseCase getMyOffersUseCase;
  final CreateOfferUseCase createOfferUseCase;
  final UpdateOfferUseCase updateOfferUseCase;
  final DeleteOfferUseCase deleteOfferUseCase;

  OffersBloc({
    required this.getMyOffersUseCase,
    required this.createOfferUseCase,
    required this.updateOfferUseCase,
    required this.deleteOfferUseCase,
  }) : super(OffersInitial()) {
    on<GetMyOffersRequested>(_onGetMyOffersRequested);
    on<CreateOfferRequested>(_onCreateOfferRequested);
    on<UpdateOfferRequested>(_onUpdateOfferRequested);
    on<DeleteOfferRequested>(_onDeleteOfferRequested);
  }

  Future<void> _onGetMyOffersRequested(
      GetMyOffersRequested event, Emitter<OffersState> emit) async {
    emit(OffersLoading());
    try {
      final offers = await getMyOffersUseCase(NoParams());
      emit(OffersLoaded(offers));
    } catch (e) {
      emit(OffersError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onCreateOfferRequested(
      CreateOfferRequested event, Emitter<OffersState> emit) async {
    emit(OffersLoading());
    try {
      await createOfferUseCase(event.offer);
      emit(OfferActionSuccess('تم إضافة العرض بنجاح وبانتظار المراجعة'));
      add(GetMyOffersRequested());
    } catch (e) {
      emit(OffersError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onUpdateOfferRequested(
      UpdateOfferRequested event, Emitter<OffersState> emit) async {
    emit(OffersLoading());
    try {
      await updateOfferUseCase(event.offer);
      emit(OfferActionSuccess('تم تحديث العرض بنجاح'));
      add(GetMyOffersRequested());
    } catch (e) {
      emit(OffersError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onDeleteOfferRequested(
      DeleteOfferRequested event, Emitter<OffersState> emit) async {
    emit(OffersLoading());
    try {
      await deleteOfferUseCase(event.id);
      emit(OfferActionSuccess('تم حذف العرض بنجاح'));
      add(GetMyOffersRequested());
    } catch (e) {
      emit(OffersError(e.toString().replaceAll('Exception: ', '')));
    }
  }
}
