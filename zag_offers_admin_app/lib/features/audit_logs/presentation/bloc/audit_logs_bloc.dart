import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:zag_offers_admin_app/features/audit_logs/domain/entities/audit_log.dart';
import 'package:zag_offers_admin_app/features/audit_logs/domain/repositories/audit_log_repository.dart';

part 'audit_logs_event.dart';
part 'audit_logs_state.dart';

class AuditLogsBloc extends Bloc<AuditLogsEvent, AuditLogsState> {
  final AuditLogRepository repository;

  AuditLogsBloc({required this.repository}) : super(AuditLogsInitial()) {
    on<LoadAuditLogsEvent>((event, emit) async {
      emit(AuditLogsLoading());
      final result = await repository.getAuditLogs();
      result.fold(
        (failure) => emit(AuditLogsError(message: failure.message)),
        (logs) => emit(AuditLogsLoaded(logs: logs)),
      );
    });
  }
}
