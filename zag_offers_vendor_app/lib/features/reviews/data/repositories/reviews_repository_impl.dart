import 'package:zag_offers_vendor_app/features/reviews/data/datasources/reviews_remote_data_source.dart';
import 'package:zag_offers_vendor_app/features/reviews/data/models/review_model.dart';
import 'package:zag_offers_vendor_app/features/reviews/domain/repositories/reviews_repository.dart';

class ReviewsRepositoryImpl implements ReviewsRepository {
  final ReviewsRemoteDataSource remoteDataSource;

  ReviewsRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<ReviewModel>> getStoreReviews(String storeId) {
    return remoteDataSource.getStoreReviews(storeId);
  }

  @override
  Future<void> addReply(String reviewId, String reply) {
    return remoteDataSource.addReply(reviewId, reply);
  }
}
