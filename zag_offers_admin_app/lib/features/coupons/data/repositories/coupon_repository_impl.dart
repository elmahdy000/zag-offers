import 'package:dartz/dartz.dart';
import 'package:zag_offers_admin_app/features/coupons/domain/entities/coupon.dart';
import 'package:zag_offers_admin_app/features/coupons/domain/repositories/coupon_repository.dart';
import 'package:zag_offers_admin_app/features/coupons/data/datasources/coupon_remote_datasource.dart';

class CouponRepositoryImpl implements CouponRepository {
  final CouponRemoteDataSource remoteDataSource;

  CouponRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<String, List<Coupon>>> getCoupons({
    String? search,
    String? status,
    int page = 1,
  }) async {
    try {
      final coupons = await remoteDataSource.getCoupons(
        search: search,
        status: status,
        page: page,
      );
      return Right(coupons);
    } catch (e) {
      return Left(e.toString());
    }
  }

  @override
  Future<Either<String, void>> deleteCoupon(String id) async {
    try {
      await remoteDataSource.deleteCoupon(id);
      return const Right(null);
    } catch (e) {
      return Left(e.toString());
    }
  }
}
