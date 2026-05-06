import 'package:dartz/dartz.dart';
import 'package:zag_offers_admin_app/core/error/failures.dart';
import 'package:zag_offers_admin_app/features/audit_logs/domain/entities/audit_log.dart';

abstract class AuditLogRepository {
  Future<Either<Failure, List<AuditLog>>> getAuditLogs();
}
