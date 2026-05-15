import 'package:equatable/equatable.dart';
import '../../domain/entities/offer_entity.dart';
import '../../domain/entities/store_entity.dart';
import '../../domain/entities/category_entity.dart';

abstract class OffersState extends Equatable {
  @override
  List<Object?> get props => [];
}

class OffersInitial extends OffersState {}
class OffersLoading extends OffersState {}
class OffersError extends OffersState {
  final String message;
  OffersError(this.message);
  @override
  List<Object?> get props => [message];
}

class OffersLoaded extends OffersState {
  final List<OfferEntity> allOffers;
  final List<OfferEntity> trendingOffers;
  final List<StoreEntity> featuredStores;
  final List<CategoryEntity> categories;
  final List<OfferEntity>? recommendedOffers;
  final List<OfferEntity>? searchResults;
  final String? noticeMessage;

  OffersLoaded({
    this.allOffers = const [],
    required this.trendingOffers,
    required this.featuredStores,
    this.categories = const [],
    this.recommendedOffers,
    this.searchResults,
    this.noticeMessage,
  });

  @override
  List<Object?> get props => [
        allOffers,
        trendingOffers,
        featuredStores,
        categories,
        recommendedOffers,
        searchResults,
        noticeMessage,
      ];
}

class StoreOffersLoading extends OffersState {}
class StoreOffersLoaded extends OffersState {
  final List<OfferEntity> offers;
  StoreOffersLoaded({required this.offers});
  @override
  List<Object?> get props => [offers];
}
