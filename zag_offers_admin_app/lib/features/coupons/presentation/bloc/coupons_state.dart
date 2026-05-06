part of 'coupons_bloc.dart';

abstract class CouponsState extends Equatable {
  const CouponsState();

  @override
  List<Object?> get props => [];
}

class CouponsInitial extends CouponsState {}

class CouponsLoading extends CouponsState {}

class CouponsLoaded extends CouponsState {
  final List<Coupon> coupons;

  const CouponsLoaded({required this.coupons});

  @override
  List<Object> get props => [coupons];
}

class CouponsError extends CouponsState {
  final String message;

  const CouponsError({required this.message});

  @override
  List<Object> get props => [message];
}

class CouponDeletedSuccess extends CouponsState {}
