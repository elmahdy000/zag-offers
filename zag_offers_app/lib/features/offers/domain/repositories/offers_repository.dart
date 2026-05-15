import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/offer_entity.dart';
import '../entities/store_entity.dart';
import '../entities/category_entity.dart';

abstract class OffersRepository {
  Future<Either<Failure, List<OfferEntity>>> getAllOffers({String? categoryId, String? area, int page = 1});
  Future<Either<Failure, List<OfferEntity>>> getTrendingOffers();
  Future<Either<Failure, List<OfferEntity>>> getRecommendedOffers();
  Future<Either<Failure, List<OfferEntity>>> searchOffers(String query);
  Future<Either<Failure, List<StoreEntity>>> getFeaturedStores();
  Future<Either<Failure, List<OfferEntity>>> getOffersByStore(String storeId);
  Future<Either<Failure, List<CategoryEntity>>> getCategories();
}
