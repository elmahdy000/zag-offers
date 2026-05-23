import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/store_model.dart';
import '../../../offers/data/models/category_model.dart';

abstract class StoreSetupRemoteDataSource {
  Future<StoreModel> createStore(Map<String, dynamic> data);
  Future<List<CategoryModel>> getCategories();
}

class StoreSetupRemoteDataSourceImpl implements StoreSetupRemoteDataSource {
  final ApiClient apiClient;

  StoreSetupRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<StoreModel> createStore(Map<String, dynamic> data) async {
    final response = await apiClient.dio.post('/stores', data: data);
    return StoreModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<List<CategoryModel>> getCategories() async {
    final response = await apiClient.dio.get('/stores/categories');
    final data = response.data;
    if (data is List) {
      return data
          .map((e) => CategoryModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }
}


