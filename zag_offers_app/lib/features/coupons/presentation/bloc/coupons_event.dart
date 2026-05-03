import 'package:equatable/equatable.dart';

abstract class CouponsEvent extends Equatable {
  const CouponsEvent();

  @override
  List<Object> get props => [];
}

class FetchUserCoupons extends CouponsEvent {}

class GenerateCouponRequested extends CouponsEvent {
  final String offerId;
  const GenerateCouponRequested(this.offerId);

  @override
  List<Object> get props => [offerId];
}
