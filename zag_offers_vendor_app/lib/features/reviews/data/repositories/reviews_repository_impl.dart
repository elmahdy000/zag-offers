import '../../domain/entities/review_entity.dart';
import '../../domain/repositories/reviews_repository.dart';
import '../datasources/reviews_remote_data_source.dart';

class ReviewsRepositoryImpl implements ReviewsRepository {
  final ReviewsRemoteDataSource remoteDataSource;

  ReviewsRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<ReviewEntity>> getStoreReviews(String storeId) {
    return remoteDataSource.getStoreReviews(storeId);
  }

  @override
  Future<void> addReply(String reviewId, String reply) {
    return remoteDataSource.addReply(reviewId, reply);
  }
}
