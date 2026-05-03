import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/coupon_entity.dart';

abstract class CouponsRepository {
  Future<Either<Failure, CouponEntity>> generateCoupon(String offerId);
  Future<Either<Failure, List<CouponEntity>>> getUserCoupons();
}
