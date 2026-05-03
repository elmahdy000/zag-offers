import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/coupon_entity.dart';
import '../repositories/coupons_repository.dart';

class GenerateCouponUseCase {
  final CouponsRepository repository;

  GenerateCouponUseCase(this.repository);

  Future<Either<Failure, CouponEntity>> call(String offerId) async {
    return await repository.generateCoupon(offerId);
  }
}
