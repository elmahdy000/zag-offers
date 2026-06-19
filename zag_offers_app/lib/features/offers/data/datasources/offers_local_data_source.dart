import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/offer_model.dart';
import '../models/store_model.dart';
import '../models/category_model.dart';

abstract class OffersLocalDataSource {
  Future<void> cacheTrendingOffers(List<OfferModel> offers);
  Future<List<OfferModel>> getCachedTrendingOffers();

  Future<void> cacheRecommendedOffers(List<OfferModel> offers);
  Future<List<OfferModel>> getCachedRecommendedOffers();

  Future<void> cacheFeaturedStores(List<StoreModel> stores);
  Future<List<StoreModel>> getCachedFeaturedStores();

  Future<void> cacheCategories(List<CategoryModel> categories);
  Future<List<CategoryModel>> getCachedCategories();
}

class OffersLocalDataSourceImpl implements OffersLocalDataSource {
  final SharedPreferences sharedPreferences;

  static const _trendingKey = 'cached_trending_offers';
  static const _recommendedKey = 'cached_recommended_offers';
  static const _featuredStoresKey = 'cached_featured_stores';
  static const _categoriesKey = 'cached_categories';

  OffersLocalDataSourceImpl({required this.sharedPreferences});

  @override
  Future<void> cacheTrendingOffers(List<OfferModel> offers) async {
    final jsonList = offers.map((o) => o.toJson()).toList();
    await sharedPreferences.setString(_trendingKey, jsonEncode(jsonList));
  }

  @override
  Future<List<OfferModel>> getCachedTrendingOffers() async {
    final jsonString = sharedPreferences.getString(_trendingKey);
    if (jsonString != null) {
      final List<dynamic> decoded = jsonDecode(jsonString);
      return decoded.map((item) => OfferModel.fromJson(item as Map<String, dynamic>)).toList();
    }
    return [];
  }

  @override
  Future<void> cacheRecommendedOffers(List<OfferModel> offers) async {
    final jsonList = offers.map((o) => o.toJson()).toList();
    await sharedPreferences.setString(_recommendedKey, jsonEncode(jsonList));
  }

  @override
  Future<List<OfferModel>> getCachedRecommendedOffers() async {
    final jsonString = sharedPreferences.getString(_recommendedKey);
    if (jsonString != null) {
      final List<dynamic> decoded = jsonDecode(jsonString);
      return decoded.map((item) => OfferModel.fromJson(item as Map<String, dynamic>)).toList();
    }
    return [];
  }

  @override
  Future<void> cacheFeaturedStores(List<StoreModel> stores) async {
    final jsonList = stores.map((s) => s.toJson()).toList();
    await sharedPreferences.setString(_featuredStoresKey, jsonEncode(jsonList));
  }

  @override
  Future<List<StoreModel>> getCachedFeaturedStores() async {
    final jsonString = sharedPreferences.getString(_featuredStoresKey);
    if (jsonString != null) {
      final List<dynamic> decoded = jsonDecode(jsonString);
      return decoded.map((item) => StoreModel.fromJson(item as Map<String, dynamic>)).toList();
    }
    return [];
  }

  @override
  Future<void> cacheCategories(List<CategoryModel> categories) async {
    final jsonList = categories.map((c) => c.toJson()).toList();
    await sharedPreferences.setString(_categoriesKey, jsonEncode(jsonList));
  }

  @override
  Future<List<CategoryModel>> getCachedCategories() async {
    final jsonString = sharedPreferences.getString(_categoriesKey);
    if (jsonString != null) {
      final List<dynamic> decoded = jsonDecode(jsonString);
      return decoded.map((item) => CategoryModel.fromJson(item as Map<String, dynamic>)).toList();
    }
    return [];
  }
}
