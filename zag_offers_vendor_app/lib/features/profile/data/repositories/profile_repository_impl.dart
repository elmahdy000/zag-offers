import 'package:zag_offers_vendor_app/features/auth/domain/entities/user_entity.dart';
import 'package:zag_offers_vendor_app/features/profile/data/datasources/profile_remote_data_source.dart';
import 'package:zag_offers_vendor_app/features/profile/domain/repositories/profile_repository.dart';

class ProfileRepositoryImpl implements ProfileRepository {
  final ProfileRemoteDataSource remoteDataSource;

  ProfileRepositoryImpl({required this.remoteDataSource});

  @override
  Future<UserEntity> getProfile() async {
    final model = await remoteDataSource.getProfile();
    return UserEntity(
      id: model.id,
      email: model.email,
      name: model.name,
      role: model.role,
      phone: model.phone,
    );
  }

  @override
  Future<UserEntity> updateProfile({String? name, String? phone}) async {
    final data = <String, dynamic>{};
    if (name != null) data['name'] = name;
    if (phone != null) data['phone'] = phone;

    final model = await remoteDataSource.updateProfile(data);
    return UserEntity(
      id: model.id,
      email: model.email,
      name: model.name,
      role: model.role,
      phone: model.phone,
    );
  }

  @override
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await remoteDataSource.changePassword(
      currentPassword: currentPassword,
      newPassword: newPassword,
    );
  }
}
