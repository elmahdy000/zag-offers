import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/coupon_entity.dart';
import '../repositories/coupons_repository.dart';

class GetUserCouponsUseCase {
  final CouponsRepository repository;

  GetUserCouponsUseCase(this.repository);

  Future<Either<Failure, List<CouponEntity>>> call() async {
    return await repository.getUserCoupons();
  }
}
