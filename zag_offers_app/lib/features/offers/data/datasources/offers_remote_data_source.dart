import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../models/offer_model.dart';
import '../models/store_model.dart';

abstract class OffersRemoteDataSource {
  Future<List<OfferModel>> getAllOffers({String? categoryId, String? area, int page = 1});
  Future<List<OfferModel>> getTrendingOffers();
  Future<List<OfferModel>> getRecommendedOffers();
  Future<List<OfferModel>> searchOffers(String query);
  Future<List<StoreModel>> getFeaturedStores();
  Future<List<OfferModel>> getOffersByStore(String storeId);
  Future<OfferModel> getOfferById(String id);
}

class OffersRemoteDataSourceImpl implements OffersRemoteDataSource {
  final ApiClient apiClient;

  OffersRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<List<OfferModel>> getAllOffers({String? categoryId, String? area, int page = 1}) async {
    try {
      final response = await apiClient.dio.get('/offers', queryParameters: {
        if (categoryId != null) 'categoryId': categoryId,
        if (area != null) 'area': area,
        'page': page,
        'limit': 20,
      });
      return (response.data as List).map<OfferModel>((json) => OfferModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }

  @override
  Future<List<OfferModel>> getTrendingOffers() async {
    try {
      final response = await apiClient.dio.get('/recommendations/trending');
      return (response.data as List).map<OfferModel>((json) => OfferModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }

  @override
  Future<List<OfferModel>> getRecommendedOffers() async {
    try {
      final response = await apiClient.dio.get('/recommendations');
      return (response.data as List).map<OfferModel>((json) => OfferModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }

  @override
  Future<List<OfferModel>> searchOffers(String query) async {
    try {
      final response = await apiClient.dio.get('/offers/search', queryParameters: {
        'q': query,
      });
      return (response.data as List).map<OfferModel>((json) => OfferModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }

  @override
  Future<List<StoreModel>> getFeaturedStores() async {
    try {
      final response = await apiClient.dio.get('/stores');
      return (response.data as List).map<StoreModel>((json) => StoreModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }

  @override
  Future<List<OfferModel>> getOffersByStore(String storeId) async {
    try {
      final response = await apiClient.dio.get('/offers/store/$storeId');
      return (response.data as List).map<OfferModel>((json) => OfferModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }

  @override
  Future<OfferModel> getOfferById(String id) async {
    try {
      final response = await apiClient.dio.get('/offers/$id');
      return OfferModel.fromJson(response.data);
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }
}

