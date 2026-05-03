import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/user_entity.dart';

abstract class AuthRepository {
  Future<Either<Failure, UserEntity>> login({
    required String phone,
    required String password,
  });

  Future<Either<Failure, UserEntity>> register({
    required String phone,
    required String password,
    required String name,
    String? area,
  });

  Future<Either<Failure, void>> logout();
  Future<Either<Failure, void>> updateFcmToken(String token);
}
