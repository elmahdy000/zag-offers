import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../repositories/auth_repository.dart';

class UpdateAvatarUseCase {
  final AuthRepository repository;
  UpdateAvatarUseCase(this.repository);

  Future<Either<Failure, String>> call(String filePath) {
    return repository.updateAvatar(filePath);
  }
}
