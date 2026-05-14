import 'package:dartz/dartz.dart';
import 'package:zag_offers_admin_app/core/error/failures.dart';
import 'package:zag_offers_admin_app/features/merchants/domain/entities/merchant.dart';
import 'package:zag_offers_admin_app/features/merchants/domain/repositories/merchant_repository.dart';
import 'package:zag_offers_admin_app/features/merchants/data/datasources/merchant_remote_datasource.dart';

class MerchantRepositoryImpl implements MerchantRepository {
  final MerchantRemoteDataSource remoteDataSource;

  MerchantRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<Failure, ({List<Merchant> items, int total})>> getMerchants({String? status}) async {
    try {
      final result = await remoteDataSource.getMerchants(status: status);
      return Right(result);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Merchant>> getMerchantDetails(String id) async {
    try {
      final merchant = await remoteDataSource.getMerchantDetails(id);
      return Right(merchant);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> updateMerchantStatus(
    String id,
    String status, {
    String? reason,
  }) async {
    try {
      await remoteDataSource.updateMerchantStatus(id, status, reason: reason);
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> deleteMerchant(String id) async {
    try {
      await remoteDataSource.deleteMerchant(id);
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> createMerchant({
    required String ownerName,
    required String phone,
    String? email,
    required String password,
    required String storeName,
    required String categoryId,
    String? area,
    String? address,
  }) async {
    try {
      await remoteDataSource.createMerchant(
        ownerName: ownerName,
        phone: phone,
        email: email,
        password: password,
        storeName: storeName,
        categoryId: categoryId,
        area: area,
        address: address,
      );
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
