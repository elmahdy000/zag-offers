import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/offer_entity.dart';
import '../repositories/offers_repository.dart';

class GetAllOffersUseCase {
  final OffersRepository repository;

  GetAllOffersUseCase(this.repository);

  Future<Either<Failure, List<OfferEntity>>> call({
    String? categoryId,
    String? area,
    int page = 1,
  }) async {
    return repository.getAllOffers(
      categoryId: categoryId,
      area: area,
      page: page,
    );
  }
}
