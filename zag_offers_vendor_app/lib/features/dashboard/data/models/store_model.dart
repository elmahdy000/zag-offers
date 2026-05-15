import '../../../../core/utils/image_url_helper.dart';
import '../../domain/entities/store_entity.dart';

class StoreModel extends StoreEntity {
  const StoreModel({
    required super.id,
    required super.name,
    super.logo,
    super.coverImage,
    required super.address,
    super.area,
    required super.phone,
    super.whatsapp,
    required super.categoryId,
    super.categoryName,
    super.images = const [],
    super.status = 'PENDING',
  });

  factory StoreModel.fromJson(Map<String, dynamic> json) {
    return StoreModel(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      logo: ImageUrlHelper.resolveNullable(json['logo']),
      coverImage: ImageUrlHelper.resolveNullable(json['coverImage']),
      address: json['address'] ?? '',
      area: json['area']?.toString(),
      phone: json['phone'] ?? '',
      whatsapp: json['whatsapp']?.toString(),
      categoryId: json['categoryId']?.toString() ?? '',
      categoryName: json['category']?['name']?.toString(),
      images: json['images'] is List
          ? (json['images'] as List).map((e) => ImageUrlHelper.resolve(e.toString())).toList()
          : [],
      status: json['status'] ?? 'PENDING',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'logo': logo,
      'coverImage': coverImage,
      'address': address,
      'area': area,
      'phone': phone,
      'whatsapp': whatsapp,
      'categoryId': categoryId,
      'images': images,
    };
  }
}
