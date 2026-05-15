import '../entities/store_entity.dart';
import '../../../offers/data/models/category_model.dart';

abstract class StoreSetupRepository {
  Future<StoreEntity> createStore(Map<String, dynamic> data);
  Future<List<CategoryModel>> getCategories();
}
