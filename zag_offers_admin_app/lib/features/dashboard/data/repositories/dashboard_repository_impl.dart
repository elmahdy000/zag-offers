import 'package:dartz/dartz.dart';
import 'package:zag_offers_admin_app/core/error/failures.dart';
import 'package:zag_offers_admin_app/features/dashboard/domain/entities/stats.dart';
import 'package:zag_offers_admin_app/features/dashboard/domain/repositories/dashboard_repository.dart';
import 'package:zag_offers_admin_app/features/dashboard/data/datasources/dashboard_remote_datasource.dart';

class DashboardRepositoryImpl implements DashboardRepository {
  final DashboardRemoteDataSource remoteDataSource;

  DashboardRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<Failure, DashboardStats>> getStats() async {
    try {
      final stats = await remoteDataSource.getStats();
      return Right(stats);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
