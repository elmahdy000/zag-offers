import 'package:dartz/dartz.dart';
import 'package:zag_offers_admin_app/core/error/failures.dart';
import 'package:zag_offers_admin_app/features/dashboard/domain/entities/stats.dart';

abstract class DashboardRepository {
  Future<Either<Failure, DashboardStats>> getStats();
}
