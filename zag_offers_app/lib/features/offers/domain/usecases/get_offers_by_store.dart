import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/offer_entity.dart';
import '../repositories/offers_repository.dart';

class GetOffersByStoreUseCase {
  final OffersRepository repository;

  GetOffersByStoreUseCase(this.repository);

  Future<Either<Failure, List<OfferEntity>>> call(String storeId) {
    return repository.getOffersByStore(storeId);
  }
}
