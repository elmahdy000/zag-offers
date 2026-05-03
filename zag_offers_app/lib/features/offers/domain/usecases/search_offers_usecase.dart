import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/offer_entity.dart';
import '../repositories/offers_repository.dart';

class SearchOffersUseCase {
  final OffersRepository repository;

  SearchOffersUseCase(this.repository);

  Future<Either<Failure, List<OfferEntity>>> call(String query) {
    return repository.searchOffers(query);
  }
}
