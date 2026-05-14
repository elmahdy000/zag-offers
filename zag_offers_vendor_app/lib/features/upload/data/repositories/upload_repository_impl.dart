import 'dart:io';
import '../../domain/repositories/upload_repository.dart';
import '../datasources/upload_remote_data_source.dart';

class UploadRepositoryImpl implements UploadRepository {
  final UploadRemoteDataSource remoteDataSource;

  UploadRepositoryImpl({required this.remoteDataSource});

  @override
  Future<String> uploadImage(File file) {
    return remoteDataSource.uploadImage(file);
  }
}
