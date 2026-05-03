import '../entities/offer_entity.dart';

abstract class OfferRepository {
  Future<List<OfferEntity>> getMyOffers();
  Future<void> createOffer(OfferEntity offer);
  Future<void> updateOffer(OfferEntity offer);
  Future<void> deleteOffer(String id);
}
