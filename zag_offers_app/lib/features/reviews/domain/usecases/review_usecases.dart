import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../repositories/reviews_repository.dart';

class AddReviewUseCase {
  final ReviewsRepository repository;
  AddReviewUseCase(this.repository);

  Future<Either<Failure, void>> call({String? storeId, String? offerId, required int rating, String? comment}) {
    return repository.addReview(storeId: storeId, offerId: offerId, rating: rating, comment: comment);
  }
}

class GetStoreReviewsUseCase {
  final ReviewsRepository repository;
  GetStoreReviewsUseCase(this.repository);

  Future<Either<Failure, List>> call(String storeId) {
    return repository.getReviewsByStore(storeId);
  }
}
