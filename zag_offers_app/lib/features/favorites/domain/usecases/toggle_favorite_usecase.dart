import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../repositories/favorites_repository.dart';

class ToggleFavoriteUseCase {
  final FavoritesRepository repository;

  ToggleFavoriteUseCase(this.repository);

  Future<Either<Failure, bool>> call(String offerId) {
    return repository.toggleFavorite(offerId);
  }
}
