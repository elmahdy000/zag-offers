part of 'audit_logs_bloc.dart';

abstract class AuditLogsState extends Equatable {
  const AuditLogsState();

  @override
  List<Object?> get props => [];
}

class AuditLogsInitial extends AuditLogsState {}

class AuditLogsLoading extends AuditLogsState {}

class AuditLogsLoaded extends AuditLogsState {
  final List<AuditLog> logs;
  const AuditLogsLoaded({required this.logs});

  @override
  List<Object?> get props => [logs];
}

class AuditLogsError extends AuditLogsState {
  final String message;
  const AuditLogsError({required this.message});

  @override
  List<Object?> get props => [message];
}
