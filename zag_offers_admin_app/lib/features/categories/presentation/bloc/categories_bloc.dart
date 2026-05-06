import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:zag_offers_admin_app/features/categories/domain/entities/category.dart';
import 'package:zag_offers_admin_app/features/categories/domain/repositories/category_repository.dart';

part 'categories_event.dart';
part 'categories_state.dart';

class CategoriesBloc extends Bloc<CategoriesEvent, CategoriesState> {
  final CategoryRepository repository;

  CategoriesBloc({required this.repository}) : super(CategoriesInitial()) {
    on<LoadCategoriesEvent>((event, emit) async {
      emit(CategoriesLoading());
      final result = await repository.getCategories();
      result.fold(
        (failure) => emit(CategoriesError(message: failure.message)),
        (categories) => emit(CategoriesLoaded(categories: categories)),
      );
    });

    on<CreateCategoryEvent>((event, emit) async {
      final result = await repository.createCategory(event.name, event.icon);
      result.fold(
        (failure) => emit(CategoriesError(message: failure.message)),
        (_) {
          emit(CategoryCreated());
          add(LoadCategoriesEvent()); // Refresh
        },
      );
    });

    on<UpdateCategoryEvent>((event, emit) async {
      final result = await repository.updateCategory(
        event.id,
        event.name,
        event.icon,
      );
      result.fold(
        (failure) => emit(CategoriesError(message: failure.message)),
        (_) {
          emit(CategoryUpdated());
          add(LoadCategoriesEvent());
        },
      );
    });

    on<DeleteCategoryEvent>((event, emit) async {
      final result = await repository.deleteCategory(event.id);
      result.fold(
        (failure) => emit(CategoriesError(message: failure.message)),
        (_) {
          emit(CategoryDeleted());
          add(LoadCategoriesEvent()); // Refresh
        },
      );
    });
  }
}
