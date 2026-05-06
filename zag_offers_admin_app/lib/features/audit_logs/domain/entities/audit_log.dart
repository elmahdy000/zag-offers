import 'package:equatable/equatable.dart';

class AuditLog extends Equatable {
  final String id;
  final String action;
  final String entityType;
  final String entityId;
  final String adminName;
  final String? details;
  final DateTime createdAt;

  const AuditLog({
    required this.id,
    required this.action,
    required this.entityType,
    required this.entityId,
    required this.adminName,
    this.details,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
    id,
    action,
    entityType,
    entityId,
    adminName,
    details,
    createdAt,
  ];
}
