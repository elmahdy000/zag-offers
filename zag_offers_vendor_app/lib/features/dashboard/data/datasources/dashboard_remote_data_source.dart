import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../models/dashboard_stats_model.dart';

abstract class DashboardRemoteDataSource {
  Future<DashboardStatsModel> getDashboardStats();
}

class DashboardRemoteDataSourceImpl implements DashboardRemoteDataSource {
  final ApiClient apiClient;

  DashboardRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<DashboardStatsModel> getDashboardStats() async {
    try {
      final response = await apiClient.dio.get('/stores/my-dashboard');
      return DashboardStatsModel.fromJson(response.data);
    } on DioException {
      rethrow;
    } catch (e) {
      throw Exception(e.toString());
    }
  }
}
