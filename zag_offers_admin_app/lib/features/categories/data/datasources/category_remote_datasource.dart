import 'package:zag_offers_admin_app/core/network/api_client.dart';
import 'package:zag_offers_admin_app/features/categories/data/models/category_model.dart';

abstract class CategoryRemoteDataSource {
  Future<List<CategoryModel>> getCategories();
  Future<void> createCategory(String name, String? icon);
  Future<void> updateCategory(String id, String name, String? icon);
  Future<void> deleteCategory(String id);
}

class CategoryRemoteDataSourceImpl implements CategoryRemoteDataSource {
  final ApiClient client;

  CategoryRemoteDataSourceImpl({required this.client});

  @override
  Future<List<CategoryModel>> getCategories() async {
    final response = await client.get('/admin/categories');
    final data = response.data;
    if (data is! List) return [];
    return data
        .whereType<Map<String, dynamic>>()
        .map((e) => CategoryModel.fromJson(e))
        .toList();
  }

  @override
  Future<void> createCategory(String name, String? icon) async {
    await client.post('/admin/categories', data: {'name': name, 'icon': icon});
  }

  @override
  Future<void> updateCategory(String id, String name, String? icon) async {
    await client.patch(
      '/admin/categories/$id',
      data: {'name': name, if (icon != null) 'icon': icon},
    );
  }

  @override
  Future<void> deleteCategory(String id) async {
    await client.delete('/admin/categories/$id');
  }
}
