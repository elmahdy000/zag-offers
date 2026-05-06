import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:zag_offers_admin_app/features/coupons/domain/entities/coupon.dart';
import 'package:zag_offers_admin_app/features/coupons/domain/repositories/coupon_repository.dart';

part 'coupons_event.dart';
part 'coupons_state.dart';

class CouponsBloc extends Bloc<CouponsEvent, CouponsState> {
  final CouponRepository repository;

  CouponsBloc({required this.repository}) : super(CouponsInitial()) {
    on<LoadCouponsEvent>((event, emit) async {
      emit(CouponsLoading());
      final result = await repository.getCoupons(
        search: event.search,
        status: event.status,
        page: event.page,
      );
      result.fold(
        (failure) => emit(CouponsError(message: failure)),
        (coupons) => emit(CouponsLoaded(coupons: coupons)),
      );
    });

    on<DeleteCouponEvent>((event, emit) async {
      final result = await repository.deleteCoupon(event.id);
      result.fold(
        (failure) => emit(CouponsError(message: failure)),
        (_) => add(const LoadCouponsEvent()),
      );
    });
  }
}
