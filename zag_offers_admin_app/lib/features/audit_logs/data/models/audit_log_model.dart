import 'package:zag_offers_admin_app/features/audit_logs/domain/entities/audit_log.dart';

class AuditLogModel extends AuditLog {
  const AuditLogModel({
    required super.id,
    required super.action,
    required super.entityType,
    required super.entityId,
    required super.adminName,
    super.details,
    required super.createdAt,
  });

  factory AuditLogModel.fromJson(Map<String, dynamic> json) {
    return AuditLogModel(
      id: json['id']?.toString() ?? '',
      action: json['action'] ?? '',
      entityType: json['entityType'] ?? '',
      entityId: json['entityId'] ?? '',
      adminName: json['admin']?['name'] ?? 'System',
      details: json['details'],
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'action': action,
      'entityType': entityType,
      'entityId': entityId,
      'details': details,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
