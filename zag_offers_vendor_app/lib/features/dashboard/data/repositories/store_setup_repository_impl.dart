import '../../domain/repositories/store_setup_repository.dart';
import '../datasources/store_setup_remote_data_source.dart';
import '../../domain/entities/store_entity.dart';
import '../../domain/entities/category_entity.dart';

class StoreSetupRepositoryImpl implements StoreSetupRepository {
  final StoreSetupRemoteDataSource remoteDataSource;

  StoreSetupRepositoryImpl({required this.remoteDataSource});

  @override
  Future<StoreEntity> createStore(Map<String, dynamic> data) {
    return remoteDataSource.createStore(data);
  }

  @override
  Future<List<CategoryEntity>> getCategories() async {
    final models = await remoteDataSource.getCategories();
    return models.map((m) => CategoryEntity(id: m.id, name: m.name, image: m.image)).toList();
  }
}

