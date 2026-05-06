import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../models/offer_model.dart';

abstract class OfferRemoteDataSource {
  Future<List<OfferModel>> getMyOffers();
  Future<void> createOffer(OfferModel offer);
  Future<void> updateOffer(String id, Map<String, dynamic> data);
  Future<void> deleteOffer(String id);
}

class OfferRemoteDataSourceImpl implements OfferRemoteDataSource {
  final ApiClient apiClient;

  OfferRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<List<OfferModel>> getMyOffers() async {
    try {
      final response = await apiClient.dio.get('/offers/my');
      final raw = response.data;
      final items = raw is List ? List<dynamic>.from(raw) : <dynamic>[];
      return items
          .map<OfferModel>((e) => OfferModel.fromJson(e))
          .toList();
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }

  @override
  Future<void> createOffer(OfferModel offer) async {
    try {
      await apiClient.dio.post('/offers', data: offer.toJson());
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? e.message);
    }
  }

  @override
  Future<void> updateOffer(String id, Map<String, dynamic> data) async {
    try {
      await apiClient.dio.patch('/offers/$id', data: data);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? e.message);
    }
  }

  @override
  Future<void> deleteOffer(String id) async {
    try {
      await apiClient.dio.delete('/offers/$id');
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }
}
