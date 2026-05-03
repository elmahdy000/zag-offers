import 'package:zag_offers_vendor_app/core/usecases/usecase.dart';
import 'package:zag_offers_vendor_app/features/auth/domain/entities/user_entity.dart';
import '../repositories/profile_repository.dart';

class GetProfileUseCase implements UseCase<UserEntity, NoParams> {
  final ProfileRepository repository;
  GetProfileUseCase(this.repository);
  @override
  Future<UserEntity> call(NoParams params) async => await repository.getProfile();
}

class UpdateProfileUseCase implements UseCase<UserEntity, UpdateProfileParams> {
  final ProfileRepository repository;
  UpdateProfileUseCase(this.repository);
  @override
  Future<UserEntity> call(UpdateProfileParams params) async {
    return await repository.updateProfile(name: params.name, phone: params.phone);
  }
}

class UpdateProfileParams {
  final String? name;
  final String? phone;
  UpdateProfileParams({this.name, this.phone});
}
