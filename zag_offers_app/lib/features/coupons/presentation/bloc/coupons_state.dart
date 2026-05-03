import 'package:equatable/equatable.dart';
import '../../domain/entities/coupon_entity.dart';

abstract class CouponsState extends Equatable {
  const CouponsState();

  @override
  List<Object> get props => [];
}

class CouponsInitial extends CouponsState {}

class CouponsLoading extends CouponsState {}

class CouponGeneratedSuccess extends CouponsState {
  final CouponEntity coupon;
  const CouponGeneratedSuccess(this.coupon);

  @override
  List<Object> get props => [coupon];
}

class UserCouponsLoaded extends CouponsState {
  final List<CouponEntity> coupons;
  const UserCouponsLoaded(this.coupons);

  @override
  List<Object> get props => [coupons];
}


class CouponsError extends CouponsState {
  final String message;
  const CouponsError(this.message);

  @override
  List<Object> get props => [message];
}
