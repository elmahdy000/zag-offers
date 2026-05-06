part of 'merchants_bloc.dart';

abstract class MerchantsState extends Equatable {
  const MerchantsState();

  @override
  List<Object?> get props => [];
}

class MerchantsInitial extends MerchantsState {}

class MerchantsLoading extends MerchantsState {}

class MerchantActionLoading extends MerchantsState {}

class MerchantsLoaded extends MerchantsState {
  final List<Merchant> merchants;
  const MerchantsLoaded({required this.merchants});

  @override
  List<Object?> get props => [merchants];
}

class MerchantStatusUpdated extends MerchantsState {}

class MerchantDeleted extends MerchantsState {}

class MerchantsError extends MerchantsState {
  final String message;
  const MerchantsError({required this.message});

  @override
  List<Object?> get props => [message];
}
