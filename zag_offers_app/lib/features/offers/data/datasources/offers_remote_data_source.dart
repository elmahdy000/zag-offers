import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../models/offer_model.dart';
import '../models/store_model.dart';
import '../models/category_model.dart';

abstract class OffersRemoteDataSource {
  Future<List<OfferModel>> getAllOffers({String? categoryId, String? area, int page = 1});
  Future<List<OfferModel>> getTrendingOffers();
  Future<List<OfferModel>> getRecommendedOffers();
  Future<List<OfferModel>> searchOffers(String query);
  Future<List<StoreModel>> getFeaturedStores();
  Future<List<OfferModel>> getOffersByStore(String storeId);
  Future<OfferModel> getOfferById(String id);
  Future<List<CategoryModel>> getCategories();
}

class OffersRemoteDataSourceImpl implements OffersRemoteDataSource {
  final ApiClient apiClient;

  OffersRemoteDataSourceImpl({required this.apiClient});

  List<T> _parseList<T>(dynamic raw, T Function(Map<String, dynamic>) fromJson) {
    if (raw is List) {
      return raw.whereType<Map<String, dynamic>>().map(fromJson).toList();
    }
    if (raw is Map && raw['items'] is List) {
      return (raw['items'] as List)
          .whereType<Map<String, dynamic>>()
          .map(fromJson)
          .toList();
    }
    return [];
  }

  @override
  Future<List<OfferModel>> getAllOffers({String? categoryId, String? area, int page = 1}) async {
    try {
      final response = await apiClient.dio.get('/offers', queryParameters: {
        if (categoryId != null) 'categoryName': categoryId, // categoryId variable here holds the name string
        if (area != null) 'area': area,
        'page': page,
        'limit': 20,
      });
      return _parseList(response.data, OfferModel.fromJson);
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }

  @override
  Future<List<OfferModel>> getTrendingOffers() async {
    try {
      final response = await apiClient.dio.get('/recommendations/trending');
      return _parseList(response.data, OfferModel.fromJson);
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }

  @override
  Future<List<OfferModel>> getRecommendedOffers() async {
    try {
      final response = await apiClient.dio.get('/recommendations');
      return _parseList(response.data, OfferModel.fromJson);
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }

  @override
  Future<List<OfferModel>> searchOffers(String query) async {
    try {
      final response = await apiClient.dio.get('/offers/search', queryParameters: {'q': query});
      return _parseList(response.data, OfferModel.fromJson);
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }

  @override
  Future<List<StoreModel>> getFeaturedStores() async {
    try {
      final response = await apiClient.dio.get('/stores');
      return _parseList(response.data, StoreModel.fromJson);
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }

  @override
  Future<List<OfferModel>> getOffersByStore(String storeId) async {
    try {
      final response = await apiClient.dio.get('/offers/store/$storeId');
      return _parseList(response.data, OfferModel.fromJson);
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }

  @override
  Future<OfferModel> getOfferById(String id) async {
    try {
      final response = await apiClient.dio.get('/offers/$id');
      return OfferModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }

  @override
  Future<List<CategoryModel>> getCategories() async {
    try {
      final response = await apiClient.dio.get('/offers/categories');
      return _parseList(response.data, CategoryModel.fromJson);
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }
}
