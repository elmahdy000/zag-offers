import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:zag_offers_admin_app/features/offers/domain/entities/offer.dart';
import 'package:zag_offers_admin_app/features/offers/domain/repositories/offer_repository.dart';

part 'offers_event.dart';
part 'offers_state.dart';

class OffersBloc extends Bloc<OffersEvent, OffersState> {
  final OfferRepository repository;

  OffersBloc({required this.repository}) : super(OffersInitial()) {
    on<LoadOffersEvent>((event, emit) async {
      emit(OffersLoading());
      final result = await repository.getOffers(status: event.status);
      result.fold(
        (failure) => emit(OffersError(message: failure.message)),
        (offers) => emit(OffersLoaded(offers: offers)),
      );
    });

    on<UpdateOfferStatusEvent>((event, emit) async {
      emit(OfferActionLoading());
      final result = await repository.updateOfferStatus(
        event.id,
        event.status,
        reason: event.reason,
      );
      result.fold((failure) => emit(OffersError(message: failure.message)), (
        _,
      ) {
        emit(OfferStatusUpdated());
        add(LoadOffersEvent()); // Refresh
      });
    });

    on<DeleteOfferEvent>((event, emit) async {
      emit(OfferActionLoading());
      final result = await repository.deleteOffer(event.id);
      result.fold(
        (failure) => emit(OffersError(message: failure.message)),
        (_) {
          emit(OfferDeleted());
          add(LoadOffersEvent(status: null));
        },
      );
    });
  }
}
