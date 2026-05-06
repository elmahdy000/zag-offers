import 'package:dartz/dartz.dart';
import 'package:zag_offers_admin_app/core/error/failures.dart';
import 'package:zag_offers_admin_app/features/categories/domain/entities/category.dart';

abstract class CategoryRepository {
  Future<Either<Failure, List<Category>>> getCategories();
  Future<Either<Failure, void>> createCategory(String name, String? icon);
  Future<Either<Failure, void>> updateCategory(String id, String name, String? icon);
  Future<Either<Failure, void>> deleteCategory(String id);
}
