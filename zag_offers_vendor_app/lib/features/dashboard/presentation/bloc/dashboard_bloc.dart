import 'package:equatable/equatable.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/dio_error_mapper.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/dashboard_stats_entity.dart';
import '../../domain/usecases/get_dashboard_stats_usecase.dart';

// --- Events ---
abstract class DashboardEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class GetDashboardStatsRequested extends DashboardEvent {}

// --- States ---
abstract class DashboardState extends Equatable {
  @override
  List<Object?> get props => [];
}

class DashboardInitial extends DashboardState {}

class DashboardLoading extends DashboardState {}

class DashboardLoaded extends DashboardState {
  final DashboardStatsEntity stats;
  final String? storeId; // Add storeId for compatibility
  
  DashboardLoaded(this.stats, {this.storeId});
  
  @override
  List<Object?> get props => [stats, storeId];
}

class DashboardError extends DashboardState {
  final String message;
  DashboardError(this.message);
  @override
  List<Object?> get props => [message];
}

// --- BLoC ---
class DashboardBloc extends Bloc<DashboardEvent, DashboardState> {
  final GetDashboardStatsUseCase getDashboardStatsUseCase;

  DashboardBloc({required this.getDashboardStatsUseCase}) : super(DashboardInitial()) {
    on<GetDashboardStatsRequested>(_onGetDashboardStatsRequested);
  }

  Future<void> _onGetDashboardStatsRequested(
    GetDashboardStatsRequested event,
    Emitter<DashboardState> emit,
  ) async {
    emit(DashboardLoading());
    try {
      final stats = await getDashboardStatsUseCase(NoParams());
      emit(DashboardLoaded(stats, storeId: stats.storeId));
    } on DioException catch (e) {
      emit(DashboardError(mapDioErrorToMessage(e, fallbackMessage: 'فشل تحميل الإحصائيات')));
    } catch (e) {
      emit(DashboardError(e.toString().replaceAll('Exception: ', '')));
    }
  }
}
