import 'package:dartz/dartz.dart';
import 'package:zag_offers_admin_app/core/error/failures.dart';
import 'package:zag_offers_admin_app/features/merchants/domain/entities/merchant.dart';

abstract class MerchantRepository {
  Future<Either<Failure, ({List<Merchant> items, int total})>> getMerchants({String? status});
  Future<Either<Failure, Merchant>> getMerchantDetails(String id);
  Future<Either<Failure, void>> updateMerchantStatus(
    String id,
    String status, {
    String? reason,
  });
  Future<Either<Failure, void>> createMerchant({
    required String ownerName,
    required String phone,
    String? email,
    required String password,
    required String storeName,
    required String categoryId,
    String? area,
    String? address,
  });
  Future<Either<Failure, void>> deleteMerchant(String id);
}
