part of 'audit_logs_bloc.dart';

abstract class AuditLogsEvent extends Equatable {
  const AuditLogsEvent();

  @override
  List<Object?> get props => [];
}

class LoadAuditLogsEvent extends AuditLogsEvent {}
