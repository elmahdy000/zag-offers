import 'package:zag_offers_vendor_app/features/reviews/data/models/review_model.dart';

abstract class ReviewsRepository {
  Future<List<ReviewModel>> getStoreReviews(String storeId);
  Future<void> addReply(String reviewId, String reply);
}
