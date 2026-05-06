part of 'categories_bloc.dart';

abstract class CategoriesEvent extends Equatable {
  const CategoriesEvent();

  @override
  List<Object?> get props => [];
}

class LoadCategoriesEvent extends CategoriesEvent {}

class CreateCategoryEvent extends CategoriesEvent {
  final String name;
  final String? icon;

  const CreateCategoryEvent({required this.name, this.icon});

  @override
  List<Object?> get props => [name, icon];
}

class UpdateCategoryEvent extends CategoriesEvent {
  final String id;
  final String name;
  final String? icon;

  const UpdateCategoryEvent({required this.id, required this.name, this.icon});

  @override
  List<Object?> get props => [id, name, icon];
}

class DeleteCategoryEvent extends CategoriesEvent {
  final String id;
  const DeleteCategoryEvent({required this.id});

  @override
  List<Object?> get props => [id];
}
