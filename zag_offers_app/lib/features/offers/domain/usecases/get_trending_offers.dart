import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/offer_entity.dart';
import '../repositories/offers_repository.dart';

class GetTrendingOffersUseCase {
  final OffersRepository repository;

  GetTrendingOffersUseCase(this.repository);

  Future<Either<Failure, List<OfferEntity>>> call() async {
    return await repository.getTrendingOffers();
  }
}
