import '../../../../core/utils/image_url_helper.dart';

class CategoryModel {
  final String id;
  final String name;
  final String? image;

  const CategoryModel({
    required this.id,
    required this.name,
    this.image,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      image: ImageUrlHelper.resolveNullable(json['image']),
    );
  }
}
