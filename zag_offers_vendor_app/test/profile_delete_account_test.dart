import 'package:flutter_test/flutter_test.dart';
import 'package:zag_offers_vendor_app/features/auth/domain/entities/user_entity.dart';
import 'package:zag_offers_vendor_app/features/profile/domain/repositories/profile_repository.dart';
import 'package:zag_offers_vendor_app/features/profile/domain/usecases/profile_usecases.dart';
import 'package:zag_offers_vendor_app/features/profile/presentation/bloc/profile_bloc.dart';

class _FakeProfileRepository implements ProfileRepository {
  var deleted = false;

  @override
  Future<void> deleteAccount() async {
    deleted = true;
  }

  @override
  Future<UserEntity> getProfile() async => _merchant;

  @override
  Future<UserEntity> updateProfile({String? name, String? phone}) async =>
      _merchant;

  @override
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {}
}

const _merchant = UserEntity(
  id: 'merchant-1',
  email: 'merchant@example.com',
  name: 'Merchant',
  role: 'MERCHANT',
);

void main() {
  test('deletes the loaded merchant account', () async {
    final repository = _FakeProfileRepository();
    final bloc = ProfileBloc(
      getProfileUseCase: GetProfileUseCase(repository),
      updateProfileUseCase: UpdateProfileUseCase(repository),
      changePasswordUseCase: ChangePasswordUseCase(repository),
      deleteAccountUseCase: DeleteAccountUseCase(repository),
    );

    bloc.add(GetProfileRequested());
    await bloc.stream.firstWhere((state) => state is ProfileLoaded);
    bloc.add(DeleteAccountRequested());
    final state = await bloc.stream.firstWhere(
      (state) => state is AccountDeleted,
    );

    expect(state, isA<AccountDeleted>());
    expect(repository.deleted, isTrue);
    await bloc.close();
  });
}
