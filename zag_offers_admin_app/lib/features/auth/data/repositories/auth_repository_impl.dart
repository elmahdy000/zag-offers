import 'package:dartz/dartz.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:zag_offers_admin_app/core/error/failures.dart';
import 'package:zag_offers_admin_app/features/auth/domain/entities/admin_user.dart';
import 'package:zag_offers_admin_app/features/auth/domain/repositories/auth_repository.dart';
import 'package:zag_offers_admin_app/features/auth/data/datasources/auth_remote_datasource.dart';
import 'package:zag_offers_admin_app/features/auth/data/models/admin_user_model.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final SharedPreferences prefs;

  AuthRepositoryImpl({required this.remoteDataSource, required this.prefs});

  @override
  Future<Either<Failure, AdminUser>> login(
    String identifier,
    String password,
  ) async {
    try {
      final response = await remoteDataSource.login(identifier, password);
      final token = response['access_token'];
      final user = AdminUserModel.fromJson(response['user']);

      await prefs.setString('token', token);

      return Right(user);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, AdminUser>> getProfile() async {
    try {
      final token = prefs.getString('token');
      if (token == null || token.isEmpty) {
        return Left(ServerFailure('No saved session'));
      }
      final user = await remoteDataSource.getProfile();
      return Right(user);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, AdminUser>> updateProfile(
    String name,
    String area,
  ) async {
    try {
      final user = await remoteDataSource.updateProfile(name: name, area: area);
      return Right(user);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> updatePassword(
    String currentPassword,
    String newPassword,
  ) async {
    try {
      await remoteDataSource.updatePassword(currentPassword, newPassword);
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<void> logout() async {
    await prefs.remove('token');
  }
}
