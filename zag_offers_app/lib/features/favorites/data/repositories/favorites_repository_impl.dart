import 'package:dartz/dartz.dart';
import 'package:zag_offers_app/core/error/error_handler.dart';

import '../../../../core/error/failures.dart';
import '../../../offers/domain/entities/offer_entity.dart';
import '../../domain/repositories/favorites_repository.dart';
import '../datasources/favorites_remote_data_source.dart';

class FavoritesRepositoryImpl implements FavoritesRepository {
  final FavoritesRemoteDataSource remoteDataSource;

  FavoritesRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<Failure, bool>> toggleFavorite(String offerId) async {
    try {
      final result = await remoteDataSource.toggleFavorite(offerId);
      return Right(result);
    } catch (e) { return Left(ServerFailure(ErrorHandler.handle(e))); }
  }

  @override
  Future<Either<Failure, List<OfferEntity>>> getFavorites() async {
    try {
      final result = await remoteDataSource.getFavorites();
      return Right(result);
    } catch (e) { return Left(ServerFailure(ErrorHandler.handle(e))); }
  }
}



