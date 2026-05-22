import '../entities/store_entity.dart';
import '../entities/category_entity.dart';

abstract class StoreSetupRepository {
  Future<StoreEntity> createStore(Map<String, dynamic> data);
  Future<List<CategoryEntity>> getCategories();
}
