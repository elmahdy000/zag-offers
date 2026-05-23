import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../data/models/user_model.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final FlutterSecureStorage secureStorage;

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.secureStorage,
  });

  @override
  Future<UserEntity> login(String identifier, String password) async {
    final userModel = await remoteDataSource.login(identifier, password);

    return UserEntity(
      id: userModel.id,
      email: userModel.email,
      name: userModel.name,
      role: userModel.role,
      phone: userModel.phone,
    );
  }

  @override
  Future<UserEntity?> checkAuthStatus() async {
    final token = await secureStorage.read(key: 'auth_token');
    final userData = await secureStorage.read(key: 'user_data');

    if (token != null && userData != null) {
      final userModel = UserModel.fromJson(jsonDecode(userData));
      if (userModel.role != 'MERCHANT' && userModel.role != 'ADMIN') {
        await logout();
        return null;
      }
      return UserEntity(
        id: userModel.id,
        email: userModel.email,
        name: userModel.name,
        role: userModel.role,
        phone: userModel.phone,
      );
    }
    return null;
  }

  @override
  Future<void> logout() async {
    await secureStorage.delete(key: 'auth_token');
    await secureStorage.delete(key: 'user_data');
  }
}

