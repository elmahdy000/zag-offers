import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';

import '../../../../core/error/exceptions.dart';
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
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message ?? 'عفوًا، فشل توليد الكوبون'));
    } on DioException catch (e) {
      return Left(ServerFailure(mapDioErrorToMessage(e)));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<CouponEntity>>> getUserCoupons() async {
    try {
      final coupons = await remoteDataSource.getUserCoupons();
      return Right(coupons);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message ?? 'عفوًا، فشل تحميل كوبوناتك'));
    } on DioException catch (e) {
      return Left(ServerFailure(mapDioErrorToMessage(e)));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
