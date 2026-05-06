import 'package:dartz/dartz.dart';
import 'package:zag_offers_admin_app/core/error/failures.dart';
import 'package:zag_offers_admin_app/features/users/domain/entities/app_user.dart';
import 'package:zag_offers_admin_app/features/users/domain/entities/app_user_details.dart';
import 'package:zag_offers_admin_app/features/users/domain/repositories/user_repository.dart';
import 'package:zag_offers_admin_app/features/users/data/datasources/user_remote_datasource.dart';

class UserRepositoryImpl implements UserRepository {
  final UserRemoteDataSource remoteDataSource;

  UserRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<Failure, List<AppUser>>> getUsers({String? search}) async {
    try {
      final users = await remoteDataSource.getUsers(search: search);
      return Right(users);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, AppUserDetails>> getUserDetails(String id) async {
    try {
      final user = await remoteDataSource.getUserDetails(id);
      return Right(user);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> deleteUser(String id) async {
    try {
      await remoteDataSource.deleteUser(id);
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> updateUser(
    String id, {
    int? points,
    String? role,
  }) async {
    try {
      await remoteDataSource.updateUser(id, points: points, role: role);
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> updateUserRole(String id, String role) async {
    try {
      await remoteDataSource.updateUserRole(id, role);
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
