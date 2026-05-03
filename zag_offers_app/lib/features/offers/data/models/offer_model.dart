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
  });

  factory OfferModel.fromJson(Map<String, dynamic> json) {
    final rawDiscount = json['discount']?.toString() ?? '0%';
    final imagesRaw = json['images'];
    final List<String> imagesList = (imagesRaw is List) 
        ? imagesRaw.map((e) => e.toString()).toList() 
        : [];
    final firstImage = imagesList.isNotEmpty ? imagesList[0] : null;

    final pct = _parseDiscountPercentage(rawDiscount);
    final dateStr = json['endDate'] ?? json['expiryDate'];

    return OfferModel(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      image: firstImage ?? json['image'],
      images: imagesList.isNotEmpty ? imagesList : (json['image'] != null ? [json['image']] : []),
      discount: rawDiscount,
      discountPercentage: pct,
      expiryDate: dateStr != null ? DateTime.tryParse(dateStr) ?? DateTime.now() : DateTime.now(),
      store: StoreModel.fromJson(json['store'] ?? {}),
    );
  }

  /// يحوّل "20%", "20", 20 → 20.0
  /// قيم زي "BOGO" ترجع 0.0
  static double _parseDiscountPercentage(dynamic raw) {
    if (raw == null) return 0.0;
    if (raw is num) return raw.toDouble();
    final cleaned = raw.toString().replaceAll('%', '').trim();
    return double.tryParse(cleaned) ?? 0.0;
  }
}
