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
class CreateMerchantEvent extends MerchantsEvent {
  final String ownerName;
  final String phone;
  final String? email;
  final String password;
  final String storeName;
  final String categoryId;
  final String? area;
  final String? address;

  const CreateMerchantEvent({
    required this.ownerName,
    required this.phone,
    this.email,
    required this.password,
    required this.storeName,
    required this.categoryId,
    this.area,
    this.address,
  });

  @override
  List<Object?> get props => [
        ownerName,
        phone,
        email,
        password,
        storeName,
        categoryId,
        area,
        address,
      ];
}
