import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../offers/domain/entities/offer_entity.dart';

abstract class FavoritesRepository {
  Future<Either<Failure, bool>> toggleFavorite(String offerId);
  Future<Either<Failure, List<OfferEntity>>> getFavorites();
}
