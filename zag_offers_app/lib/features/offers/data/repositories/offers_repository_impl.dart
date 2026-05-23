import 'package:dartz/dartz.dart';
import 'package:zag_offers_app/core/error/error_handler.dart';

import '../../../../core/error/failures.dart';
import '../../domain/entities/offer_entity.dart';
import '../../domain/entities/store_entity.dart';
import '../../domain/entities/category_entity.dart';
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
    } catch (e) { return Left(ServerFailure(ErrorHandler.handle(e))); }
  }

  @override
  Future<Either<Failure, List<OfferEntity>>> getTrendingOffers() async {
    try {
      final result = await remoteDataSource.getTrendingOffers();
      return Right(result);
    } catch (e) { return Left(ServerFailure(ErrorHandler.handle(e))); }
  }

  @override
  Future<Either<Failure, List<OfferEntity>>> getRecommendedOffers() async {
    try {
      final result = await remoteDataSource.getRecommendedOffers();
      return Right(result);
    } catch (e) { return Left(ServerFailure(ErrorHandler.handle(e))); }
  }

  @override
  Future<Either<Failure, List<OfferEntity>>> searchOffers(String query) async {
    try {
      final result = await remoteDataSource.searchOffers(query);
      return Right(result);
    } catch (e) { return Left(ServerFailure(ErrorHandler.handle(e))); }
  }

  @override
  Future<Either<Failure, List<StoreEntity>>> getFeaturedStores() async {
    try {
      final result = await remoteDataSource.getFeaturedStores();
      return Right(result);
    } catch (e) { return Left(ServerFailure(ErrorHandler.handle(e))); }
  }

  @override
  Future<Either<Failure, List<OfferEntity>>> getOffersByStore(
    String storeId,
  ) async {
    try {
      final result = await remoteDataSource.getOffersByStore(storeId);
      return Right(result);
    } catch (e) { return Left(ServerFailure(ErrorHandler.handle(e))); }
  }

  @override
  Future<Either<Failure, List<CategoryEntity>>> getCategories() async {
    try {
      final result = await remoteDataSource.getCategories();
      return Right(result);
    } catch (e) { return Left(ServerFailure(ErrorHandler.handle(e))); }
  }

  @override
  Future<Either<Failure, OfferEntity>> getOfferById(String id) async {
    try {
      final result = await remoteDataSource.getOfferById(id);
      return Right(result);
    } catch (e) { return Left(ServerFailure(ErrorHandler.handle(e))); }
  }

  @override
  Future<Either<Failure, StoreEntity>> getStoreById(String id) async {
    try {
      final result = await remoteDataSource.getStoreById(id);
      return Right(result);
    } catch (e) { return Left(ServerFailure(ErrorHandler.handle(e))); }
  }
}



