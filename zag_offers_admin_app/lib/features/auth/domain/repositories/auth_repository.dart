import 'package:dartz/dartz.dart';
import 'package:zag_offers_admin_app/core/error/failures.dart';
import 'package:zag_offers_admin_app/features/auth/domain/entities/admin_user.dart';

abstract class AuthRepository {
  Future<Either<Failure, AdminUser>> login(String identifier, String password);
  Future<Either<Failure, AdminUser>> getProfile();
  Future<Either<Failure, AdminUser>> updateProfile(String name, String area);
  Future<Either<Failure, void>> updatePassword(
    String currentPassword,
    String newPassword,
  );
  Future<void> logout();
}
