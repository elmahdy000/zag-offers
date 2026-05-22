import 'package:equatable/equatable.dart';
import '../../../../core/utils/image_url_helper.dart';

class CategoryEntity extends Equatable {
  final String id;
  final String name;
  final String? image;

  const CategoryEntity({
    required this.id,
    required this.name,
    this.image,
  });

  factory CategoryEntity.fromJson(Map<String, dynamic> json) {
    return CategoryEntity(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      image: ImageUrlHelper.resolveNullable(json['image']),
    );
  }

  @override
  List<Object?> get props => [id, name, image];
}
