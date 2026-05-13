import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import '../../../../core/error/exceptions.dart';

import '../../../../core/error/failures.dart';
import '../../../../core/network/dio_error_mapper.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_local_data_source.dart';
import '../datasources/auth_remote_data_source.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final AuthLocalDataSource localDataSource;

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.localDataSource,
  });

  @override
  Future<Either<Failure, UserEntity>> login({
    required String identifier,
    required String password,
  }) async {
    try {
      final userModel = await remoteDataSource.login(identifier, password);

      if (userModel.token != null) {
        await localDataSource.cacheToken(userModel.token!);
      }
      await localDataSource.cacheUserId(userModel.id);
      await localDataSource.cacheUserName(userModel.name);
      await localDataSource.cacheUserRole(userModel.role);

      return Right(userModel);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message ?? 'فشل تسجيل الدخول'));
    } on DioException catch (e) {
      final message = mapDioErrorToMessage(
        e,
        fallbackMessage: 'حصلت مشكلة في الدخول، جرّب تاني',
      );
      return Left(ServerFailure(message));
    } catch (_) {
      return const Left(ServerFailure('عفوًا، حصل خطأ غير متوقع'));
    }
  }

  @override
  Future<Either<Failure, UserEntity>> register({
    required String phone,
    required String password,
    required String name,
    String? area,
    String? email,
  }) async {
    try {
      final userModel = await remoteDataSource.register(
        phone,
        password,
        name,
        area,
        email,
      );

      if (userModel.token != null) {
        await localDataSource.cacheToken(userModel.token!);
      }
      await localDataSource.cacheUserId(userModel.id);
      await localDataSource.cacheUserName(userModel.name);
      await localDataSource.cacheUserRole(userModel.role);

      return Right(userModel);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message ?? 'فشل إنشاء الحساب'));
    } on DioException catch (e) {
      final message = mapDioErrorToMessage(
        e,
        fallbackMessage: 'حصلت مشكلة في التسجيل، جرّب تاني',
      );
      return Left(ServerFailure(message));
    } catch (_) {
      return const Left(ServerFailure('عفوًا، حصل خطأ غير متوقع'));
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {
    try {
      await localDataSource.clearCache();
      return const Right(null);
    } catch (_) {
      return const Left(ServerFailure('فشل تسجيل الخروج'));
    }
  }

  @override
  Future<Either<Failure, void>> updateFcmToken(String token) async {
    try {
      await remoteDataSource.updateFcmToken(token);
      return const Right(null);
    } on DioException catch (e) {
      return Left(ServerFailure(mapDioErrorToMessage(e)));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> forgotPassword(String email) async {
    try {
      await remoteDataSource.forgotPassword(email);
      return const Right(null);
    } on DioException catch (e) {
      return Left(ServerFailure(mapDioErrorToMessage(e)));
    } catch (e) {
      return Left(ServerFailure(e.toString().replaceAll('Exception: ', '')));
    }
  }

  @override
  Future<Either<Failure, void>> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    try {
      await remoteDataSource.resetPassword(email, otp, newPassword);
      return const Right(null);
    } on DioException catch (e) {
      return Left(ServerFailure(mapDioErrorToMessage(e)));
    } catch (e) {
      return Left(ServerFailure(e.toString().replaceAll('Exception: ', '')));
    }
  }
}
