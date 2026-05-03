import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/store_entity.dart';
import '../repositories/offers_repository.dart';

class GetFeaturedStoresUseCase {
  final OffersRepository repository;

  GetFeaturedStoresUseCase(this.repository);

  Future<Either<Failure, List<StoreEntity>>> call() async {
    return await repository.getFeaturedStores();
  }
}
