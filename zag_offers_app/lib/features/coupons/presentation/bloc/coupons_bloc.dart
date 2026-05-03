import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/generate_coupon_usecase.dart';
import '../../domain/usecases/get_user_coupons_usecase.dart';

import 'coupons_event.dart';
import 'coupons_state.dart';

class CouponsBloc extends Bloc<CouponsEvent, CouponsState> {
  final GenerateCouponUseCase generateCouponUseCase;
  final GetUserCouponsUseCase getUserCouponsUseCase;

  CouponsBloc({
    required this.generateCouponUseCase,
    required this.getUserCouponsUseCase,
  }) : super(CouponsInitial()) {
    on<GenerateCouponRequested>(_onGenerateCouponRequested);
    on<FetchUserCoupons>(_onFetchUserCoupons);
  }


  Future<void> _onGenerateCouponRequested(
    GenerateCouponRequested event,
    Emitter<CouponsState> emit,
  ) async {
    emit(CouponsLoading());
    final result = await generateCouponUseCase(event.offerId);

    result.fold(
      (failure) => emit(CouponsError(failure.message)),
      (coupon) => emit(CouponGeneratedSuccess(coupon)),
    );
  }

  Future<void> _onFetchUserCoupons(
    FetchUserCoupons event,
    Emitter<CouponsState> emit,
  ) async {
    emit(CouponsLoading());
    final result = await getUserCouponsUseCase();

    result.fold(
      (failure) => emit(CouponsError(failure.message)),
      (coupons) => emit(UserCouponsLoaded(coupons)),
    );
  }
}

