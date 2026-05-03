import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';

import '../../../../core/error/failures.dart';
import '../../../../core/network/dio_error_mapper.dart';
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
    } on DioException catch (e) {
      final message = mapDioErrorToMessage(
        e,
        fallbackMessage: 'عفوًا، فشل توليد الكوبون',
      );
      return Left(ServerFailure(message));
    } catch (_) {
      return const Left(ServerFailure('عفوًا، حصل خطأ غير متوقع'));
    }
  }

  @override
  Future<Either<Failure, List<CouponEntity>>> getUserCoupons() async {
    try {
      final coupons = await remoteDataSource.getUserCoupons();
      return Right(coupons);
    } on DioException catch (e) {
      final message = mapDioErrorToMessage(
        e,
        fallbackMessage: 'عفوًا، فشل تحميل كوبوناتك',
      );
      return Left(ServerFailure(message));
    } catch (_) {
      return const Left(ServerFailure('عفوًا، فشل تحميل كوبوناتك'));
    }
  }
}
