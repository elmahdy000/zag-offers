import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/review_entity.dart';

abstract class ReviewsRepository {
  Future<Either<Failure, void>> addReview({String? storeId, String? offerId, required int rating, String? comment});
  Future<Either<Failure, List<ReviewEntity>>> getReviewsByStore(String storeId);
}
