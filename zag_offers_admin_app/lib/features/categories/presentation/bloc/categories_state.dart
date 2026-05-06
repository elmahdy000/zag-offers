part of 'categories_bloc.dart';

abstract class CategoriesState extends Equatable {
  const CategoriesState();

  @override
  List<Object?> get props => [];
}

class CategoriesInitial extends CategoriesState {}

class CategoriesLoading extends CategoriesState {}

class CategoriesLoaded extends CategoriesState {
  final List<Category> categories;
  const CategoriesLoaded({required this.categories});

  @override
  List<Object?> get props => [categories];
}

class CategoryCreated extends CategoriesState {}

class CategoryUpdated extends CategoriesState {}

class CategoryDeleted extends CategoriesState {}

class CategoriesError extends CategoriesState {
  final String message;
  const CategoriesError({required this.message});

  @override
  List<Object?> get props => [message];
}
