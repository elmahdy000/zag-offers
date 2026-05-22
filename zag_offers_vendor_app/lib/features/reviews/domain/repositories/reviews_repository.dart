import '../entities/review_entity.dart';

abstract class ReviewsRepository {
  Future<List<ReviewEntity>> getStoreReviews(String storeId);
  Future<void> addReply(String reviewId, String reply);
}
