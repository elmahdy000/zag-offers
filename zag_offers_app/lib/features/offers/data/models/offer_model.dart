import 'package:zag_offers_app/core/utils/image_url_helper.dart';
import '../../domain/entities/offer_entity.dart';
import 'store_model.dart';

class OfferModel extends OfferEntity {
  const OfferModel({
    required super.id,
    required super.title,
    super.description,
    super.image,
    super.images,
    required super.discount,
    required super.discountPercentage,
    required super.expiryDate,
    required super.store,
    super.terms,
    super.oldPrice,
    super.newPrice,
    super.viewCount = 0,
    super.isFeatured = false,
    super.status = 'ACTIVE',
  });

  factory OfferModel.fromJson(Map<String, dynamic> json) {
    final rawDiscount = json['discount']?.toString() ?? '0%';
    final imagesRaw = json['images'];
    final List<String> imagesList = (imagesRaw is List)
        ? imagesRaw.map((e) => ImageUrlHelper.resolve(e.toString())).toList()
        : [];
    final firstImage = imagesList.isNotEmpty ? imagesList[0] : null;

    final pct = _parseDiscountPercentage(rawDiscount);
    final dateStr = json['endDate'] ?? json['expiryDate'];

    return OfferModel(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      image: firstImage ?? ImageUrlHelper.resolveNullable(json['image']?.toString()),
      images: imagesList.isNotEmpty ? imagesList : (json['image'] != null ? [ImageUrlHelper.resolve(json['image'].toString())] : []),
      discount: rawDiscount,
      discountPercentage: pct,
      expiryDate: dateStr != null ? DateTime.tryParse(dateStr) ?? DateTime.now() : DateTime.now(),
      store: StoreModel.fromJson(json['store'] ?? {}),
      terms: json['terms']?.toString(),
      oldPrice: (json['oldPrice'] ?? json['originalPrice']) != null ? double.tryParse((json['oldPrice'] ?? json['originalPrice']).toString()) : null,
      newPrice: json['newPrice'] != null ? double.tryParse(json['newPrice'].toString()) : null,
      viewCount: json['viewCount'] ?? 0,
      isFeatured: json['isFeatured'] ?? false,
      status: json['status'] ?? 'ACTIVE',
    );
  }

  static double _parseDiscountPercentage(String discount) {
    try {
      final cleaned = discount.replaceAll('%', '').trim();
      return double.tryParse(cleaned) ?? 0.0;
    } catch (_) {
      return 0.0;
    }
  }
}