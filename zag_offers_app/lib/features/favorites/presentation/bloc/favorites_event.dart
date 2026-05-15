import 'package:equatable/equatable.dart';

abstract class FavoritesEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class FetchFavorites extends FavoritesEvent {}

class ToggleFavorite extends FavoritesEvent {
  final String offerId;

  ToggleFavorite(this.offerId);

  @override
  List<Object?> get props => [offerId];
}
