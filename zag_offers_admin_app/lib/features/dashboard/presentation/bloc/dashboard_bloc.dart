import 'package:equatable/equatable.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:zag_offers_admin_app/features/dashboard/domain/entities/stats.dart';
import 'package:zag_offers_admin_app/features/dashboard/domain/repositories/dashboard_repository.dart';

part 'dashboard_event.dart';
part 'dashboard_state.dart';

class DashboardBloc extends Bloc<DashboardEvent, DashboardState> {
  final DashboardRepository repository;

  DashboardBloc({required this.repository}) : super(DashboardInitial()) {
    on<LoadDashboardStatsEvent>((event, emit) async {
      emit(DashboardLoading());
      final result = await repository.getStats();
      result.fold(
        (failure) {
          debugPrint('DashboardBloc ERROR: ${failure.message}');
          emit(DashboardError(message: failure.message));
        },
        (stats) {
          debugPrint(
            'DashboardBloc LOADED: merchants=${stats.totalMerchants} '
            'pending=${stats.pendingMerchants} users=${stats.totalUsers} '
            'offers=${stats.activeOffers}',
          );
          emit(DashboardLoaded(stats: stats));
        },
      );
    });
  }
}
