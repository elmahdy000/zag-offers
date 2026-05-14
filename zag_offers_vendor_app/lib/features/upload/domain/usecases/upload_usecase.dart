import 'dart:io';
import '../repositories/upload_repository.dart';

class UploadUseCase {
  final UploadRepository repository;

  UploadUseCase(this.repository);

  Future<String> call(File file) {
    return repository.uploadImage(file);
  }
}
