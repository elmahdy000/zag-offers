part of 'merchants_bloc.dart';

abstract class MerchantsEvent extends Equatable {
  const MerchantsEvent();

  @override
  List<Object?> get props => [];
}

class LoadMerchantsEvent extends MerchantsEvent {
  final String? status;
  const LoadMerchantsEvent({this.status});

  @override
  List<Object?> get props => [status];
}

class UpdateMerchantStatusEvent extends MerchantsEvent {
  final String id;
  final String status;
  final String? reason;

  const UpdateMerchantStatusEvent({
    required this.id,
    required this.status,
    this.reason,
  });

  @override
  List<Object?> get props => [id, status, reason];
}

class DeleteMerchantEvent extends MerchantsEvent {
  final String id;
  const DeleteMerchantEvent({required this.id});

  @override
  List<Object?> get props => [id];
}
