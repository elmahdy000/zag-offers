import 'package:zag_offers_vendor_app/features/auth/domain/entities/user_entity.dart';

abstract class ProfileRepository {
  Future<UserEntity> getProfile();
  Future<UserEntity> updateProfile({String? name, String? phone});
  Future<void> changePassword({required String currentPassword, required String newPassword});
}
