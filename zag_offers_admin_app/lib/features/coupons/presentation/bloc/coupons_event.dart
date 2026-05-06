part of 'coupons_bloc.dart';

abstract class CouponsEvent extends Equatable {
  const CouponsEvent();

  @override
  List<Object?> get props => [];
}

class LoadCouponsEvent extends CouponsEvent {
  final String? search;
  final String? status;
  final int page;

  const LoadCouponsEvent({this.search, this.status, this.page = 1});

  @override
  List<Object?> get props => [search, status, page];
}

class DeleteCouponEvent extends CouponsEvent {
  final String id;

  const DeleteCouponEvent({required this.id});

  @override
  List<Object> get props => [id];
}
