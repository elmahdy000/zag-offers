import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/dio_error_mapper.dart';
import '../../domain/repositories/store_setup_repository.dart';
import '../../domain/entities/store_entity.dart';
import '../../../offers/data/models/category_model.dart';

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

class StoreSetupLoading extends StoreSetupState {}

class CategoriesLoaded extends StoreSetupState {
  final List<CategoryModel> categories;
  CategoriesLoaded(this.categories);
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
  StoreSetupError(this.message);
  @override
  List<Object?> get props => [message];
}

// --- BLoC ---
class StoreSetupBloc extends Bloc<StoreSetupEvent, StoreSetupState> {
  final StoreSetupRepository repository;

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
      final categories = await repository.getCategories();
      emit(CategoriesLoaded(categories));
    } on DioException catch (e) {
      emit(StoreSetupError(mapDioErrorToMessage(e)));
    } catch (e) {
      emit(StoreSetupError(e.toString()));
    }
  }

  Future<void> _onCreateStoreRequested(
    CreateStoreRequested event,
    Emitter<StoreSetupState> emit,
  ) async {
    emit(StoreSetupLoading());
    try {
      final store = await repository.createStore(event.data);
      emit(StoreCreatedSuccess(store));
    } on DioException catch (e) {
      emit(StoreSetupError(mapDioErrorToMessage(e)));
    } catch (e) {
      emit(StoreSetupError(e.toString()));
    }
  }
}
