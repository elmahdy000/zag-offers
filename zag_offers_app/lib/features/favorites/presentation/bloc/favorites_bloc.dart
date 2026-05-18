import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/usecases/get_favorites_usecase.dart';
import '../../domain/usecases/toggle_favorite_usecase.dart';
import '../../../offers/domain/entities/offer_entity.dart';
import 'favorites_event.dart';
import 'favorites_state.dart';

export 'favorites_event.dart';
export 'favorites_state.dart';

class FavoritesBloc extends Bloc<FavoritesEvent, FavoritesState> {
  final GetFavoritesUseCase getFavoritesUseCase;
  final ToggleFavoriteUseCase toggleFavoriteUseCase;

  FavoritesBloc({
    required this.getFavoritesUseCase,
    required this.toggleFavoriteUseCase,
  }) : super(FavoritesInitial()) {
    on<FetchFavorites>(_onFetchFavorites);
    on<ToggleFavorite>(_onToggleFavorite);
  }

  Future<void> _onFetchFavorites(
    FetchFavorites event,
    Emitter<FavoritesState> emit,
  ) async {
    emit(FavoritesLoading());
    final result = await getFavoritesUseCase();
    result.fold(
      (failure) => emit(FavoritesError(failure.message)),
      (favorites) => emit(FavoritesLoaded(favorites)),
    );
  }

  Future<void> _onToggleFavorite(
    ToggleFavorite event,
    Emitter<FavoritesState> emit,
  ) async {
    final toggleResult = await toggleFavoriteUseCase(event.offerId);
    toggleResult.fold(
      (failure) => emit(FavoritesError(failure.message)),
      (_) {
        final currentList = state is FavoritesLoaded
            ? (state as FavoritesLoaded).favorites
            : <OfferEntity>[];
        final wasFavorited = currentList.any((o) => o.id == event.offerId);
        emit(FavoritesLoaded(
          wasFavorited
              ? currentList.where((o) => o.id != event.offerId).toList()
              : currentList,
        ));
      },
    );
  }
}
