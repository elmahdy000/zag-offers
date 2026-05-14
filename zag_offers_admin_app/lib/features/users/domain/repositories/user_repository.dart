import 'package:dartz/dartz.dart';
import 'package:zag_offers_admin_app/core/error/failures.dart';
import 'package:zag_offers_admin_app/features/users/domain/entities/app_user.dart';
import 'package:zag_offers_admin_app/features/users/domain/entities/app_user_details.dart';

abstract class UserRepository {
  Future<Either<Failure, ({List<AppUser> items, int total})>> getUsers({String? search});
  Future<Either<Failure, AppUserDetails>> getUserDetails(String id);
  Future<Either<Failure, void>> deleteUser(String id);
  Future<Either<Failure, void>> updateUser(
    String id, {
    int? points,
    String? role,
  });
  Future<Either<Failure, void>> updateUserRole(String id, String role);
}
