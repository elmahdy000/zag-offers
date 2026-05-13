import 'package:dio/dio.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/dio_error_mapper.dart';
import '../models/review_model.dart';

abstract class ReviewsRemoteDataSource {
  Future<void> addReview({String? storeId, String? offerId, required int rating, String? comment});
  Future<List<ReviewModel>> getReviewsByStore(String storeId);
}

class ReviewsRemoteDataSourceImpl implements ReviewsRemoteDataSource {
  final ApiClient apiClient;

  ReviewsRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<void> addReview({String? storeId, String? offerId, required int rating, String? comment}) async {
    try {
      await apiClient.dio.post('/reviews', data: {
        if (storeId != null) 'storeId': storeId,
        if (offerId != null) 'offerId': offerId,
        'rating': rating,
        if (comment != null) 'comment': comment,
      });
    } on DioException catch (e) {
      throw ServerException(mapDioErrorToMessage(e));
    }
  }

  @override
  Future<List<ReviewModel>> getReviewsByStore(String storeId) async {
    try {
      final response = await apiClient.dio.get('/reviews/store/$storeId');
      final raw = response.data;
      if (raw is List) {
        return raw.whereType<Map<String, dynamic>>()
            .map((json) => ReviewModel.fromJson(json))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      throw ServerException(mapDioErrorToMessage(e));
    }
  }
}
