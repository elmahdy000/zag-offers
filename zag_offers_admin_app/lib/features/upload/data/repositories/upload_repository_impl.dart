import 'dart:io';
import 'package:dartz/dartz.dart';
import 'package:zag_offers_admin_app/core/error/failures.dart';
import 'package:zag_offers_admin_app/features/upload/data/datasources/upload_remote_datasource.dart';
import 'package:zag_offers_admin_app/features/upload/domain/repositories/upload_repository.dart';

class UploadRepositoryImpl implements UploadRepository {
  final UploadRemoteDataSource remoteDataSource;

  UploadRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<Failure, String>> uploadImage(File file) async {
    try {
      final url = await remoteDataSource.uploadImage(file);
      return Right(url);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
