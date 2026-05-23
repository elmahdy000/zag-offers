import 'package:dio/dio.dart';
import 'package:zag_offers_vendor_app/core/network/api_client.dart';
import '../models/review_model.dart';

abstract class ReviewsRemoteDataSource {
  Future<List<ReviewModel>> getStoreReviews(String storeId);
  Future<void> addReply(String reviewId, String reply);
}

class ReviewsRemoteDataSourceImpl implements ReviewsRemoteDataSource {
  final ApiClient apiClient;

  ReviewsRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<List<ReviewModel>> getStoreReviews(String storeId) async {
    try {
      final response = await apiClient.dio.get('/reviews/store/$storeId');
      final List<dynamic> data;
      if (response.data is List) {
        data = response.data as List<dynamic>;
      } else if (response.data is Map && (response.data as Map).containsKey('data')) {
        data = (response.data as Map)['data'] as List<dynamic>;
      } else {
        data = [];
      }
      return data.map((e) => ReviewModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException {
      rethrow;
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<void> addReply(String reviewId, String reply) async {
    try {
      await apiClient.dio.post('/reviews/$reviewId/reply', data: {'reply': reply});
    } on DioException {
      rethrow;
    } catch (e) {
      rethrow;
    }
  }
}

