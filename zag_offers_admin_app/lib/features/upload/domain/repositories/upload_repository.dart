import 'dart:io';
import 'package:zag_offers_admin_app/core/error/failures.dart';
import 'package:dartz/dartz.dart';

abstract class UploadRepository {
  Future<Either<Failure, String>> uploadImage(File file);
}

class UploadUseCase {
  final UploadRepository repository;
  UploadUseCase(this.repository);

  Future<Either<Failure, String>> call(File file) => repository.uploadImage(file);
}
