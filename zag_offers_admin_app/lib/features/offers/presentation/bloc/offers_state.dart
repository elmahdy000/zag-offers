part of 'offers_bloc.dart';

abstract class OffersState extends Equatable {
  const OffersState();

  @override
  List<Object?> get props => [];
}

class OffersInitial extends OffersState {}

class OffersLoading extends OffersState {}

class OfferActionLoading extends OffersState {}

class OffersLoaded extends OffersState {
  final List<Offer> offers;
  const OffersLoaded({required this.offers});

  @override
  List<Object?> get props => [offers];
}

class OfferStatusUpdated extends OffersState {}

class OfferDeleted extends OffersState {}

class OfferCreated extends OffersState {}

class OfferUpdated extends OffersState {}

class OffersError extends OffersState {
  final String message;
  const OffersError({required this.message});

  @override
  List<Object?> get props => [message];
}
