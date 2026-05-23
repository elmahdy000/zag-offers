import 'package:dartz/dartz.dart';
import 'package:zag_offers_app/core/error/error_handler.dart';

import '../../../../core/error/failures.dart';
import '../../domain/entities/review_entity.dart';
import '../../domain/repositories/reviews_repository.dart';
import '../datasources/reviews_remote_data_source.dart';

class ReviewsRepositoryImpl implements ReviewsRepository {
  final ReviewsRemoteDataSource remoteDataSource;

  ReviewsRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<Failure, void>> addReview({
    String? storeId,
    String? offerId,
    required int rating,
    String? comment,
  }) async {
    try {
      await remoteDataSource.addReview(
        storeId: storeId,
        offerId: offerId,
        rating: rating,
        comment: comment,
      );
      return const Right(null);
    } catch (e) { return Left(ServerFailure(ErrorHandler.handle(e))); }
  }

  @override
  Future<Either<Failure, List<ReviewEntity>>> getReviewsByStore(
    String storeId,
  ) async {
    try {
      final result = await remoteDataSource.getReviewsByStore(storeId);
      return Right(result);
    } catch (e) { return Left(ServerFailure(ErrorHandler.handle(e))); }
  }
}



