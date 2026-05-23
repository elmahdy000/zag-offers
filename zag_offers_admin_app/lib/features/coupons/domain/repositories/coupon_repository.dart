import 'package:dartz/dartz.dart';
import 'package:zag_offers_admin_app/core/error/failures.dart';
import 'package:zag_offers_admin_app/features/coupons/domain/entities/coupon.dart';

abstract class CouponRepository {
  Future<Either<Failure, List<Coupon>>> getCoupons({
    String? search,
    String? status,
    int page = 1,
  });
  Future<Either<Failure, void>> deleteCoupon(String id);
}
