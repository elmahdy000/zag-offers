import 'package:zag_offers_admin_app/core/network/api_client.dart';
import 'package:zag_offers_admin_app/features/audit_logs/data/models/audit_log_model.dart';

abstract class AuditLogRemoteDataSource {
  Future<List<AuditLogModel>> getAuditLogs();
}

class AuditLogRemoteDataSourceImpl implements AuditLogRemoteDataSource {
  final ApiClient client;

  AuditLogRemoteDataSourceImpl({required this.client});

  @override
  Future<List<AuditLogModel>> getAuditLogs() async {
    final response = await client.get('/admin/audit-logs');
    final data = response.data;

    final List raw;
    if (data is List) {
      raw = data;
    } else if (data is Map && data['items'] is List) {
      raw = data['items'] as List;
    } else {
      raw = [];
    }

    return raw
        .whereType<Map<String, dynamic>>()
        .map((e) => AuditLogModel.fromJson(e))
        .toList();
  }
}
