import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../offers/data/models/offer_model.dart';

abstract class FavoritesRemoteDataSource {
  Future<bool> toggleFavorite(String offerId);
  Future<List<OfferModel>> getFavorites();
}

class FavoritesRemoteDataSourceImpl implements FavoritesRemoteDataSource {
  final ApiClient apiClient;

  FavoritesRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<bool> toggleFavorite(String offerId) async {
    try {
      final response = await apiClient.dio.post('/favorites/toggle/$offerId');
      return response.data['favorited'] ?? false;
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }

  @override
  Future<List<OfferModel>> getFavorites() async {
    try {
      final response = await apiClient.dio.get('/favorites');
      return (response.data as List).map<OfferModel>((json) {
        final item = json as Map<String, dynamic>;
        final offerJson = item['offer'];

        if (offerJson is Map<String, dynamic>) {
          return OfferModel.fromJson(offerJson);
        }

        return OfferModel.fromJson(item);
      }).toList();
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }
}
