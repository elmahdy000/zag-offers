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
    try {
      final response = await apiClient.dio.post('/stores', data: data);
      return StoreModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      final msg = e.response?.data?['message'];
      throw Exception(msg is List ? msg.join(', ') : (msg?.toString() ?? 'فشل إنشاء المتجر'));
    } catch (e) {
      throw Exception('حدث خطأ غير متوقع: $e');
    }
  }

  @override
  Future<List<CategoryModel>> getCategories() async {
    try {
      final response = await apiClient.dio.get('/stores/categories');
      final data = response.data;
      if (data is List) {
        return data
            .whereType<Map<String, dynamic>>()
            .map((e) => CategoryModel.fromJson(e))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      final msg = e.response?.data?['message'];
      throw Exception(msg?.toString() ?? 'فشل تحميل الأقسام');
    } catch (e) {
      throw Exception('حدث خطأ غير متوقع: $e');
    }
  }
}

