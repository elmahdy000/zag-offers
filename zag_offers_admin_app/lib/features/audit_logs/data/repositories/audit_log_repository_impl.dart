import 'package:dartz/dartz.dart';
import 'package:zag_offers_admin_app/core/error/failures.dart';
import 'package:zag_offers_admin_app/features/audit_logs/domain/entities/audit_log.dart';
import 'package:zag_offers_admin_app/features/audit_logs/domain/repositories/audit_log_repository.dart';
import 'package:zag_offers_admin_app/features/audit_logs/data/datasources/audit_log_remote_datasource.dart';

class AuditLogRepositoryImpl implements AuditLogRepository {
  final AuditLogRemoteDataSource remoteDataSource;

  AuditLogRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<Failure, List<AuditLog>>> getAuditLogs() async {
    try {
      final logs = await remoteDataSource.getAuditLogs();
      return Right(logs);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
