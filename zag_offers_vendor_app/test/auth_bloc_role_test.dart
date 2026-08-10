import 'package:flutter_test/flutter_test.dart';
import 'package:zag_offers_vendor_app/features/auth/domain/entities/user_entity.dart';
import 'package:zag_offers_vendor_app/features/auth/domain/repositories/auth_repository.dart';
import 'package:zag_offers_vendor_app/features/auth/domain/usecases/login_usecase.dart';
import 'package:zag_offers_vendor_app/features/auth/presentation/bloc/auth_bloc.dart';

class _FakeAuthRepository implements AuthRepository {
  _FakeAuthRepository({required this.user});

  UserEntity? user;
  bool loggedOut = false;

  @override
  Future<UserEntity> login(String identifier, String password) async => user!;

  @override
  Future<UserEntity?> checkAuthStatus() async => user;

  @override
  Future<void> logout() async {
    loggedOut = true;
  }
}

const _admin = UserEntity(
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'ADMIN',
);

void main() {
  test('rejects an admin login from the vendor app', () async {
    final repository = _FakeAuthRepository(user: _admin);
    final bloc = AuthBloc(
      loginUseCase: LoginUseCase(repository),
      authRepository: repository,
    );
    final states = <AuthState>[];
    final subscription = bloc.stream.listen(states.add);

    bloc.add(LoginRequested(identifier: '01000000000', password: 'password'));
    await bloc.stream.firstWhere((state) => state is AuthError);

    expect(states, contains(isA<AuthLoading>()));
    expect(states.last, isA<AuthError>());
    expect(repository.loggedOut, isTrue);

    await subscription.cancel();
    await bloc.close();
  });

  test('clears a restored non-merchant session', () async {
    final repository = _FakeAuthRepository(user: _admin);
    final bloc = AuthBloc(
      loginUseCase: LoginUseCase(repository),
      authRepository: repository,
    );

    bloc.add(CheckAuthStatus());
    final state = await bloc.stream.firstWhere(
      (state) => state is AuthUnauthenticated,
    );

    expect(state, isA<AuthUnauthenticated>());
    expect(repository.loggedOut, isTrue);
    await bloc.close();
  });
}
