import '../../../../core/usecases/usecase.dart';
import '../entities/offer_entity.dart';
import '../repositories/offer_repository.dart';

class GetMyOffersUseCase implements UseCase<List<OfferEntity>, NoParams> {
  final OfferRepository repository;
  GetMyOffersUseCase(this.repository);
  @override
  Future<List<OfferEntity>> call(NoParams params) async => await repository.getMyOffers();
}

class CreateOfferUseCase implements UseCase<void, OfferEntity> {
  final OfferRepository repository;
  CreateOfferUseCase(this.repository);
  @override
  Future<void> call(OfferEntity offer) async => await repository.createOffer(offer);
}

class UpdateOfferUseCase implements UseCase<void, OfferEntity> {
  final OfferRepository repository;
  UpdateOfferUseCase(this.repository);
  @override
  Future<void> call(OfferEntity offer) async => await repository.updateOffer(offer);
}

class DeleteOfferUseCase implements UseCase<void, String> {
  final OfferRepository repository;
  DeleteOfferUseCase(this.repository);
  @override
  Future<void> call(String id) async => await repository.deleteOffer(id);
}
