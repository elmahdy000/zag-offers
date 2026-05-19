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
      final List<dynamic> data = response.data as List<dynamic>;
      return data.map((e) => ReviewModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException {
      rethrow;
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  @override
  Future<void> addReply(String reviewId, String reply) async {
    try {
      await apiClient.dio.post('/reviews/$reviewId/reply', data: {'reply': reply});
    } on DioException {
      rethrow;
    } catch (e) {
      throw Exception(e.toString());
    }
  }
}
