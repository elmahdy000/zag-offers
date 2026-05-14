import 'package:dartz/dartz.dart';
import 'package:zag_offers_admin_app/core/error/failures.dart';
import 'package:zag_offers_admin_app/features/offers/domain/entities/offer.dart';
import 'package:zag_offers_admin_app/features/offers/domain/repositories/offer_repository.dart';
import 'package:zag_offers_admin_app/features/offers/data/datasources/offer_remote_datasource.dart';
import 'package:zag_offers_admin_app/core/error/error_handler.dart';

class OfferRepositoryImpl implements OfferRepository {
  final OfferRemoteDataSource remoteDataSource;

  OfferRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<Failure, List<Offer>>> getOffers({String? status, String? merchantId}) async {
    try {
      final offers = await remoteDataSource.getOffers(status: status, merchantId: merchantId);
      return Right(offers);
    } catch (e) {
      return Left(ServerFailure(ErrorHandler.handle(e)));
    }
  }

  @override
  Future<Either<Failure, void>> updateOfferStatus(
    String id,
    String status, {
    String? reason,
  }) async {
    try {
      await remoteDataSource.updateOfferStatus(id, status, reason: reason);
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(ErrorHandler.handle(e)));
    }
  }

  @override
  Future<Either<Failure, void>> deleteOffer(String id) async {
    try {
      await remoteDataSource.deleteOffer(id);
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(ErrorHandler.handle(e)));
    }
  }

  @override
  Future<Either<Failure, void>> createOffer(Map<String, dynamic> offerData) async {
    try {
      await remoteDataSource.createOffer(offerData);
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(ErrorHandler.handle(e)));
    }
  }

  @override
  Future<Either<Failure, void>> updateOffer(String id, Map<String, dynamic> offerData) async {
    try {
      await remoteDataSource.updateOffer(id, offerData);
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(ErrorHandler.handle(e)));
    }
  }
}
