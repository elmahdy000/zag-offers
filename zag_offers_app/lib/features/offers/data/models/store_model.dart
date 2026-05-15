import 'package:zag_offers_app/core/utils/image_url_helper.dart';
import '../../domain/entities/store_entity.dart';

class StoreModel extends StoreEntity {
  const StoreModel({
    required super.id,
    required super.name,
    super.logo,
    super.coverImage,
    super.category,
    required super.area,
    super.rating,
    super.latitude,
    super.longitude,
    super.images,
    super.phone,
    super.whatsapp,
  });

  factory StoreModel.fromJson(Map<String, dynamic> json) {
    return StoreModel(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      name: json['name'] ?? '',
      logo: ImageUrlHelper.resolveNullable(json['logo']),
      coverImage: ImageUrlHelper.resolveNullable(json['coverImage']),
      category: _parseCategory(json['category']),
      area: json['area'] ?? '',
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      latitude: (json['lat'] as num?)?.toDouble(),
      longitude: (json['lng'] as num?)?.toDouble(),
      images: json['images'] != null
          ? ImageUrlHelper.resolveList(List<String>.from(json['images']))
          : null,
      phone: json['phone'],
      whatsapp: json['whatsapp'],
    );
  }

  static String? _parseCategory(dynamic raw) {
    if (raw == null) return null;
    if (raw is String) return raw;
    if (raw is Map) return raw['name']?.toString();
    return null;
  }
}

