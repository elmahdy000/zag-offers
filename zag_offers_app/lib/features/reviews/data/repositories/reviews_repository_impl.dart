import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';

import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/dio_error_mapper.dart';
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
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message ?? 'Server error'));
    } on DioException catch (e) {
      return Left(ServerFailure(mapDioErrorToMessage(e)));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<ReviewEntity>>> getReviewsByStore(
    String storeId,
  ) async {
    try {
      final result = await remoteDataSource.getReviewsByStore(storeId);
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
