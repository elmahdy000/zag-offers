import 'dart:io';
import '../../data/datasources/upload_remote_data_source.dart';

abstract class UploadRepository {
  Future<String> uploadImage(File file);
}

class UploadRepositoryImpl implements UploadRepository {
  final UploadRemoteDataSource remoteDataSource;

  UploadRepositoryImpl({required this.remoteDataSource});

  @override
  Future<String> uploadImage(File file) async {
    return await remoteDataSource.uploadImage(file);
  }
}

class UploadUseCase {
  final UploadRepository repository;
  UploadUseCase(this.repository);

  Future<String> call(File file) async {
    return await repository.uploadImage(file);
  }
}
