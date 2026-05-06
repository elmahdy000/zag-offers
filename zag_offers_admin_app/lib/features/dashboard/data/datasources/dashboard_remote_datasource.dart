import 'package:zag_offers_admin_app/core/network/api_client.dart';
import 'package:zag_offers_admin_app/features/dashboard/data/models/stats_model.dart';

abstract class DashboardRemoteDataSource {
  Future<StatsModel> getStats();
}

class DashboardRemoteDataSourceImpl implements DashboardRemoteDataSource {
  final ApiClient client;

  DashboardRemoteDataSourceImpl({required this.client});

  @override
  Future<StatsModel> getStats() async {
    final response = await client.get('/admin/stats/global');
    final model = StatsModel.fromJson(response.data);
    return model;
  }
}
