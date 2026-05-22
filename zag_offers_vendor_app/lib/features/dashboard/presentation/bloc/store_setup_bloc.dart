import 'package:flutter/foundation.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/dio_error_mapper.dart';
import '../../domain/repositories/store_setup_repository.dart';
import '../../domain/entities/store_entity.dart';
import '../../domain/entities/category_entity.dart';

// --- Events ---
abstract class StoreSetupEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class GetCategoriesRequested extends StoreSetupEvent {}

class CreateStoreRequested extends StoreSetupEvent {
  final Map<String, dynamic> data;
  CreateStoreRequested(this.data);
  @override
  List<Object?> get props => [data];
}

// --- States ---
abstract class StoreSetupState extends Equatable {
  @override
  List<Object?> get props => [];
}

class StoreSetupInitial extends StoreSetupState {}

/// Loading state while fetching categories (first load)
class StoreSetupLoading extends StoreSetupState {}

class CategoriesLoaded extends StoreSetupState {
  final List<CategoryEntity> categories;
  CategoriesLoaded(this.categories);
  @override
  List<Object?> get props => [categories];
}

/// Submission in progress — categories remain accessible so dropdown doesn't crash
class StoreSubmitting extends StoreSetupState {
  final List<CategoryEntity> categories;
  StoreSubmitting(this.categories);
  @override
  List<Object?> get props => [categories];
}

class StoreCreatedSuccess extends StoreSetupState {
  final StoreEntity store;
  StoreCreatedSuccess(this.store);
  @override
  List<Object?> get props => [store];
}

class StoreSetupError extends StoreSetupState {
  final String message;
  final List<CategoryEntity> categories;
  StoreSetupError(this.message, {this.categories = const []});
  @override
  List<Object?> get props => [message, categories];
}

// --- BLoC ---
class StoreSetupBloc extends Bloc<StoreSetupEvent, StoreSetupState> {
  final StoreSetupRepository repository;

  /// Cached categories so they survive state transitions during submission
  List<CategoryEntity> _categories = [];

  StoreSetupBloc({required this.repository}) : super(StoreSetupInitial()) {
    on<GetCategoriesRequested>(_onGetCategoriesRequested);
    on<CreateStoreRequested>(_onCreateStoreRequested);
  }

  Future<void> _onGetCategoriesRequested(
    GetCategoriesRequested event,
    Emitter<StoreSetupState> emit,
  ) async {
    emit(StoreSetupLoading());
    try {
      _categories = await repository.getCategories();
      debugPrint('[StoreSetupBloc] Loaded ${_categories.length} categories');
      emit(CategoriesLoaded(_categories));
    } on DioException catch (e) {
      debugPrint('[StoreSetupBloc] DioException loading categories: ${e.message} | status: ${e.response?.statusCode}');
      emit(StoreSetupError(mapDioErrorToMessage(e), categories: _categories));
    } catch (e) {
      debugPrint('[StoreSetupBloc] Exception loading categories: $e');
      emit(StoreSetupError(
        e.toString().replaceAll('Exception: ', ''),
        categories: _categories,
      ));
    }
  }

  Future<void> _onCreateStoreRequested(
    CreateStoreRequested event,
    Emitter<StoreSetupState> emit,
  ) async {
    emit(StoreSubmitting(_categories));
    try {
      final store = await repository.createStore(event.data);
      emit(StoreCreatedSuccess(store));
    } on DioException catch (e) {
      emit(StoreSetupError(mapDioErrorToMessage(e), categories: _categories));
    } catch (e) {
      emit(StoreSetupError(
        e.toString().replaceAll('Exception: ', ''),
        categories: _categories,
      ));
    }
  }
}
