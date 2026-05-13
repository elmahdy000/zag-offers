import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../data/models/user_model.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final SharedPreferences sharedPreferences;

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.sharedPreferences,
  });

  @override
  Future<UserEntity> login(String identifier, String password) async {
    final userModel = await remoteDataSource.login(identifier, password);

    // Convert to entity
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
    final token = sharedPreferences.getString('auth_token');
    final userData = sharedPreferences.getString('user_data');

    if (token != null && userData != null) {
      final userModel = UserModel.fromJson(jsonDecode(userData));
      if (userModel.role != 'MERCHANT') {
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
    await sharedPreferences.remove('auth_token');
    await sharedPreferences.remove('user_data');
  }
}
