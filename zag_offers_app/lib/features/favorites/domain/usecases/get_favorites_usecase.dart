import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../offers/domain/entities/offer_entity.dart';
import '../repositories/favorites_repository.dart';

class GetFavoritesUseCase {
  final FavoritesRepository repository;

  GetFavoritesUseCase(this.repository);

  Future<Either<Failure, List<OfferEntity>>> call() {
    return repository.getFavorites();
  }
}
