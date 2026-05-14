part of 'offers_bloc.dart';

abstract class OffersEvent extends Equatable {
  const OffersEvent();

  @override
  List<Object?> get props => [];
}

class LoadOffersEvent extends OffersEvent {
  final String? status;
  final String? merchantId;
  const LoadOffersEvent({this.status, this.merchantId});

  @override
  List<Object?> get props => [status, merchantId];
}

class UpdateOfferStatusEvent extends OffersEvent {
  final String id;
  final String status;
  final String? reason;

  const UpdateOfferStatusEvent({
    required this.id,
    required this.status,
    this.reason,
  });

  @override
  List<Object?> get props => [id, status, reason];
}

class DeleteOfferEvent extends OffersEvent {
  final String id;
  const DeleteOfferEvent({required this.id});

  @override
  List<Object?> get props => [id];
}

class CreateOfferEvent extends OffersEvent {
  final Map<String, dynamic> offerData;
  const CreateOfferEvent({required this.offerData});

  @override
  List<Object?> get props => [offerData];
}

class UpdateOfferEvent extends OffersEvent {
  final String id;
  final Map<String, dynamic> offerData;
  const UpdateOfferEvent({required this.id, required this.offerData});

  @override
  List<Object?> get props => [id, offerData];
}
