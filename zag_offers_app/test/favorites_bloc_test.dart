import 'package:bloc_test/bloc_test.dart';
import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:zag_offers_app/core/error/failures.dart';
import 'package:zag_offers_app/features/favorites/domain/repositories/favorites_repository.dart';
import 'package:zag_offers_app/features/favorites/domain/usecases/get_favorites_usecase.dart';
import 'package:zag_offers_app/features/favorites/domain/usecases/toggle_favorite_usecase.dart';
import 'package:zag_offers_app/features/favorites/presentation/bloc/favorites_bloc.dart';
import 'package:zag_offers_app/features/offers/domain/entities/offer_entity.dart';
import 'package:zag_offers_app/features/offers/domain/entities/store_entity.dart';

class MockGetFavoritesUseCase extends Mock implements GetFavoritesUseCase {}
class MockToggleFavoriteUseCase extends Mock implements ToggleFavoriteUseCase {}

StoreEntity createStore({String id = 's1'}) {
  return StoreEntity(id: id, name: 'Store $id', area: 'Zagazig');
}

OfferEntity createOffer({String id = 'o1', String storeId = 's1'}) {
  return OfferEntity(
    id: id,
    title: 'Offer $id',
    discount: '20%',
    expiryDate: DateTime.now().add(const Duration(days: 30)),
    store: createStore(id: storeId),
  );
}

void main() {
  late FavoritesBloc bloc;
  late MockGetFavoritesUseCase mockGetFavorites;
  late MockToggleFavoriteUseCase mockToggleFavorite;

  setUp(() {
    mockGetFavorites = MockGetFavoritesUseCase();
    mockToggleFavorite = MockToggleFavoriteUseCase();
    bloc = FavoritesBloc(
      getFavoritesUseCase: mockGetFavorites,
      toggleFavoriteUseCase: mockToggleFavorite,
    );
  });

  tearDown(() {
    bloc.close();
  });

  group('FavoritesBloc', () {
    final offer1 = createOffer(id: 'o1');
    final offer2 = createOffer(id: 'o2');
    final favorites = [offer1, offer2];

    test('initial state is FavoritesInitial', () {
      expect(bloc.state, equals(FavoritesInitial()));
    });

    blocTest<FavoritesBloc, FavoritesState>(
      'emits [Loading, Loaded] when FetchFavorites succeeds',
      setUp: () {
        when(() => mockGetFavorites.call())
            .thenAnswer((_) async => Right(favorites));
      },
      build: () => bloc,
      act: (bloc) => bloc.add(FetchFavorites()),
      expect: () => [
        FavoritesLoading(),
        FavoritesLoaded(favorites),
      ],
    );

    blocTest<FavoritesBloc, FavoritesState>(
      'emits [Loading, Error] when FetchFavorites fails',
      setUp: () {
        when(() => mockGetFavorites.call())
            .thenAnswer((_) async => Left(ServerFailure('Network error')));
      },
      build: () => bloc,
      act: (bloc) => bloc.add(FetchFavorites()),
      expect: () => [
        FavoritesLoading(),
        FavoritesError('Network error'),
      ],
    );

    blocTest<FavoritesBloc, FavoritesState>(
      'emits Error on toggle failure when no cached list exists',
      setUp: () {
        when(() => mockToggleFavorite.call('o1'))
            .thenAnswer((_) async => Left(ServerFailure('Error')));
      },
      build: () => bloc,
      act: (bloc) => bloc.add(ToggleFavorite('o1')),
      expect: () => [FavoritesError('Error')],
    );

    blocTest<FavoritesBloc, FavoritesState>(
      'emits cached Loaded on toggle failure when _lastFavorites is populated',
      setUp: () {
        when(() => mockGetFavorites.call())
            .thenAnswer((_) async => Right(favorites));
        when(() => mockToggleFavorite.call('o3'))
            .thenAnswer((_) async => Left(ServerFailure('Error')));
      },
      build: () => bloc,
      act: (bloc) {
        bloc.add(FetchFavorites());
      },
      wait: const Duration(milliseconds: 50),
      expect: () => [FavoritesLoading(), FavoritesLoaded(favorites)],
    );

    blocTest<FavoritesBloc, FavoritesState>(
      'emits [Error] on toggle failure when no cached list exists',
      setUp: () {
        when(() => mockToggleFavorite.call('o1'))
            .thenAnswer((_) async => Left(ServerFailure('Error')));
      },
      build: () => bloc,
      act: (bloc) => bloc.add(ToggleFavorite('o1')),
      expect: () => [
        FavoritesError('Error'),
      ],
    );
  });
}
