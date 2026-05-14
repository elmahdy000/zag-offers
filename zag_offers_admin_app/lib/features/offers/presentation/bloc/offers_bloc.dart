import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:zag_offers_admin_app/features/offers/domain/entities/offer.dart';
import 'package:zag_offers_admin_app/features/offers/domain/repositories/offer_repository.dart';

part 'offers_event.dart';
part 'offers_state.dart';

class OffersBloc extends Bloc<OffersEvent, OffersState> {
  final OfferRepository repository;
  String? _currentStatus;
  String? _currentMerchantId;

  OffersBloc({required this.repository}) : super(OffersInitial()) {
    on<LoadOffersEvent>((event, emit) async {
      // Update cache only if values are provided in the event
      // We check the event's props to see if it was a 'refresh' call or a 'filter change' call
      // For simplicity, in this app, the UI always passes filters when changing them.
      // If the UI calls LoadOffersEvent() from initState, it means "Reset/Initial".
      
      _currentStatus = event.status;
      _currentMerchantId = event.merchantId;
      
      emit(OffersLoading());
      final result = await repository.getOffers(
        status: _currentStatus,
        merchantId: _currentMerchantId,
      );
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
        add(LoadOffersEvent(status: _currentStatus, merchantId: _currentMerchantId));
      });
    });

    on<DeleteOfferEvent>((event, emit) async {
      emit(OfferActionLoading());
      final result = await repository.deleteOffer(event.id);
      result.fold(
        (failure) => emit(OffersError(message: failure.message)),
        (_) {
          emit(OfferDeleted());
          add(LoadOffersEvent(status: _currentStatus, merchantId: _currentMerchantId));
        },
      );
    });

    on<CreateOfferEvent>((event, emit) async {
      emit(OfferActionLoading());
      final result = await repository.createOffer(event.offerData);
      result.fold(
        (failure) => emit(OffersError(message: failure.message)),
        (_) {
          emit(OfferCreated());
          add(LoadOffersEvent(status: _currentStatus, merchantId: _currentMerchantId));
        },
      );
    });

    on<UpdateOfferEvent>((event, emit) async {
      emit(OfferActionLoading());
      final result = await repository.updateOffer(event.id, event.offerData);
      result.fold(
        (failure) => emit(OffersError(message: failure.message)),
        (_) {
          emit(OfferUpdated());
          add(LoadOffersEvent(status: _currentStatus, merchantId: _currentMerchantId));
        },
      );
    });
  }
}
