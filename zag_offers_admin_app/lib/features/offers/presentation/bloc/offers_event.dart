part of 'offers_bloc.dart';

abstract class OffersEvent extends Equatable {
  const OffersEvent();

  @override
  List<Object?> get props => [];
}

class LoadOffersEvent extends OffersEvent {
  final String? status;
  const LoadOffersEvent({this.status});

  @override
  List<Object?> get props => [status];
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
