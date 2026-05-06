import 'package:dartz/dartz.dart';
import 'package:zag_offers_admin_app/core/error/failures.dart';
import 'package:zag_offers_admin_app/features/offers/domain/entities/offer.dart';

abstract class OfferRepository {
  Future<Either<Failure, List<Offer>>> getOffers({String? status});
  Future<Either<Failure, void>> updateOfferStatus(
    String id,
    String status, {
    String? reason,
  });
  Future<Either<Failure, void>> deleteOffer(String id);
}
