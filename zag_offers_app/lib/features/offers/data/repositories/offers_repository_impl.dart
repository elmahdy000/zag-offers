import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';

import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/dio_error_mapper.dart';
import '../../domain/entities/offer_entity.dart';
import '../../domain/entities/store_entity.dart';
import '../../domain/repositories/offers_repository.dart';
import '../datasources/offers_remote_data_source.dart';

class OffersRepositoryImpl implements OffersRepository {
  final OffersRemoteDataSource remoteDataSource;

  OffersRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<Failure, List<OfferEntity>>> getAllOffers({
    String? categoryId,
    String? area,
    int page = 1,
  }) async {
    try {
      final result = await remoteDataSource.getAllOffers(
        categoryId: categoryId,
        area: area,
        page: page,
      );
      return Right(result);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message ?? 'Server error'));
    } on DioException catch (e) {
      return Left(ServerFailure(mapDioErrorToMessage(e)));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<OfferEntity>>> getTrendingOffers() async {
    try {
      final result = await remoteDataSource.getTrendingOffers();
      return Right(result);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message ?? 'Server error'));
    } on DioException catch (e) {
      return Left(ServerFailure(mapDioErrorToMessage(e)));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<OfferEntity>>> getRecommendedOffers() async {
    try {
      final result = await remoteDataSource.getRecommendedOffers();
      return Right(result);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message ?? 'Server error'));
    } on DioException catch (e) {
      return Left(ServerFailure(mapDioErrorToMessage(e)));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<OfferEntity>>> searchOffers(String query) async {
    try {
      final result = await remoteDataSource.searchOffers(query);
      return Right(result);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message ?? 'Server error'));
    } on DioException catch (e) {
      return Left(ServerFailure(mapDioErrorToMessage(e)));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<StoreEntity>>> getFeaturedStores() async {
    try {
      final result = await remoteDataSource.getFeaturedStores();
      return Right(result);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message ?? 'Server error'));
    } on DioException catch (e) {
      return Left(ServerFailure(mapDioErrorToMessage(e)));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<OfferEntity>>> getOffersByStore(
    String storeId,
  ) async {
    try {
      final result = await remoteDataSource.getOffersByStore(storeId);
      return Right(result);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message ?? 'Server error'));
    } on DioException catch (e) {
      return Left(ServerFailure(mapDioErrorToMessage(e)));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
