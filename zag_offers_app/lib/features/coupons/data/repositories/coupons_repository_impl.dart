import 'package:dartz/dartz.dart';

import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/coupon_entity.dart';
import '../../domain/repositories/coupons_repository.dart';
import '../datasources/coupons_remote_data_source.dart';

class CouponsRepositoryImpl implements CouponsRepository {
  final CouponsRemoteDataSource remoteDataSource;

  CouponsRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<Failure, CouponEntity>> generateCoupon(String offerId) async {
    try {
      final coupon = await remoteDataSource.generateCoupon(offerId);
      return Right(coupon);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message ?? 'عفوًا، فشل توليد الكوبون'));
    } catch (_) {
      return const Left(ServerFailure('عفوًا، حصل خطأ غير متوقع'));
    }
  }

  @override
  Future<Either<Failure, List<CouponEntity>>> getUserCoupons() async {
    try {
      final coupons = await remoteDataSource.getUserCoupons();
      return Right(coupons);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message ?? 'عفوًا، فشل تحميل كوبوناتك'));
    } catch (_) {
      return const Left(ServerFailure('عفوًا، فشل تحميل كوبوناتك'));
    }
  }
}
