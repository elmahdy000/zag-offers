import 'package:equatable/equatable.dart';

abstract class OffersEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class FetchHomeData extends OffersEvent {}
class FetchAllOffers extends OffersEvent {
  final String? categoryId;
  final String? area;
  final int page;
  
  FetchAllOffers({this.categoryId, this.area, this.page = 1});

  @override
  List<Object?> get props => [categoryId, area, page];
}
class FetchStoreOffers extends OffersEvent {
  final String storeId;
  FetchStoreOffers(this.storeId);
  @override
  List<Object?> get props => [storeId];
}
class SearchOffers extends OffersEvent {
  final String query;
  SearchOffers(this.query);
  @override
  List<Object?> get props => [query];
}
class FetchRecommendedOffers extends OffersEvent {}
class AddLiveOffer extends OffersEvent {
  final Map<String, dynamic> rawData;
  AddLiveOffer(this.rawData);
  @override
  List<Object?> get props => [rawData];
}
