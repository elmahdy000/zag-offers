import '../../domain/entities/offer_entity.dart';

class OfferModel extends OfferEntity {
  const OfferModel({
    required super.id,
    required super.title,
    required super.description,
    required super.images,
    required super.discount,
    super.terms,
    required super.startDate,
    required super.endDate,
    super.usageLimit,
    required super.status,
    required super.storeId,
    super.oldPrice,
    super.newPrice,
    super.rejectionReason,
    super.viewCount = 0,
    super.couponsCount = 0,
    super.isFeatured = false,
  });

  factory OfferModel.fromJson(Map<String, dynamic> json) {
    return OfferModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      images: List<String>.from(json['images'] ?? []),
      discount: json['discount'] ?? '',
      terms: json['terms'],
      startDate: json['startDate'] != null 
          ? (DateTime.tryParse(json['startDate'].toString()) ?? DateTime.now()) 
          : DateTime.now(),
      endDate: json['endDate'] != null 
          ? (DateTime.tryParse(json['endDate'].toString()) ?? DateTime.now().add(const Duration(days: 7))) 
          : DateTime.now().add(const Duration(days: 7)),
      usageLimit: json['usageLimit'],
      status: json['status'] ?? 'PENDING',
      storeId: json['storeId'] ?? '',
      oldPrice: json['oldPrice'] != null ? double.tryParse(json['oldPrice'].toString()) : null,
      newPrice: json['newPrice'] != null ? double.tryParse(json['newPrice'].toString()) : null,
      rejectionReason: json['rejectionReason'],
      viewCount: json['viewCount'] ?? 0,
      couponsCount: json['couponsCount'] ?? (json['_count']?['coupons'] ?? 0),
      isFeatured: json['isFeatured'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'images': images,
      'discount': discount,
      'terms': terms,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'usageLimit': usageLimit,
      'storeId': storeId,
      'originalPrice': oldPrice ?? newPrice,
      'rejectionReason': rejectionReason,
      'viewCount': viewCount,
      'isFeatured': isFeatured,
    };
  }
}
