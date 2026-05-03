import '../../../../core/usecases/usecase.dart';
import '../entities/dashboard_stats_entity.dart';
import '../repositories/dashboard_repository.dart';

class GetDashboardStatsUseCase implements UseCase<DashboardStatsEntity, NoParams> {
  final DashboardRepository repository;

  GetDashboardStatsUseCase(this.repository);

  @override
  Future<DashboardStatsEntity> call(NoParams params) async {
    return await repository.getDashboardStats();
  }
}
