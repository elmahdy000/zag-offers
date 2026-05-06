import 'package:dartz/dartz.dart';
import 'package:zag_offers_admin_app/core/error/failures.dart';
import 'package:zag_offers_admin_app/features/merchants/domain/entities/merchant.dart';

abstract class MerchantRepository {
  Future<Either<Failure, List<Merchant>>> getMerchants({String? status});
  Future<Either<Failure, Merchant>> getMerchantDetails(String id);
  Future<Either<Failure, void>> updateMerchantStatus(
    String id,
    String status, {
    String? reason,
  });
  Future<Either<Failure, void>> deleteMerchant(String id);
}
