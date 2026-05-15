import '../../domain/entities/offer_entity.dart';
import '../../domain/repositories/offer_repository.dart';
import '../datasources/offer_remote_data_source.dart';
import '../models/offer_model.dart';

class OfferRepositoryImpl implements OfferRepository {
  final OfferRemoteDataSource remoteDataSource;

  OfferRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<OfferEntity>> getMyOffers() async => await remoteDataSource.getMyOffers();

  @override
  Future<void> createOffer(OfferEntity offer) async {
    final model = OfferModel(
      id: offer.id,
      title: offer.title,
      description: offer.description,
      images: offer.images,
      discount: offer.discount,
      terms: offer.terms,
      startDate: offer.startDate,
      endDate: offer.endDate,
      usageLimit: offer.usageLimit,
      status: offer.status,
      storeId: offer.storeId,
      oldPrice: offer.oldPrice,
      newPrice: offer.newPrice,
    );
    return await remoteDataSource.createOffer(model);
  }

  @override
  Future<void> updateOffer(OfferEntity offer) async {
    final model = OfferModel(
      id: offer.id,
      title: offer.title,
      description: offer.description,
      images: offer.images,
      discount: offer.discount,
      terms: offer.terms,
      startDate: offer.startDate,
      endDate: offer.endDate,
      usageLimit: offer.usageLimit,
      status: offer.status,
      storeId: offer.storeId,
      oldPrice: offer.oldPrice,
      newPrice: offer.newPrice,
    );
    return await remoteDataSource.updateOffer(offer.id, model.toJson());
  }

  @override
  Future<void> deleteOffer(String id) async => await remoteDataSource.deleteOffer(id);
}
