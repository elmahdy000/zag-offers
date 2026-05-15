import 'package:zag_offers_admin_app/core/utils/image_url_helper.dart';
import 'package:zag_offers_admin_app/features/offers/domain/entities/offer.dart';

class OfferModel extends Offer {
  const OfferModel({
    required super.id,
    required super.title,
    required super.description,
    required super.status,
    super.imageUrl,
    super.images = const [],
    required super.storeName,
    required super.merchantId,
    required super.startDate,
    required super.endDate,
    required super.createdAt,
    super.oldPrice,
    super.newPrice,
    super.rejectionReason,
    super.viewCount = 0,
    super.isFeatured = false,
  });

  factory OfferModel.fromJson(Map<String, dynamic> json) {
    String? imageUrl;
    final imagesJson = json['images'];
    if (imagesJson is List && imagesJson.isNotEmpty) {
      imageUrl = ImageUrlHelper.resolveNullable(imagesJson[0]?.toString());
    } else if (json['imageUrl'] != null) {
      imageUrl = ImageUrlHelper.resolveNullable(json['imageUrl']?.toString());
    }

    return OfferModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      status: json['status']?.toString() ?? 'PENDING',
      imageUrl: imageUrl,
      images: imagesJson is List
          ? List<String>.from(imagesJson.map((x) => ImageUrlHelper.resolve(x.toString())))
          : (imageUrl != null ? [imageUrl] : []),
      storeName: json['store']?['name']?.toString() ??
          json['storeName']?.toString() ??
          'Unknown Store',
      merchantId: json['store']?['ownerId']?.toString() ??
          json['merchantId']?.toString() ??
          '',
      startDate: json['startDate'] != null
          ? DateTime.tryParse(json['startDate'].toString()) ?? DateTime.now()
          : DateTime.now(),
      endDate: json['endDate'] != null
          ? DateTime.tryParse(json['endDate'].toString()) ??
              DateTime.now().add(const Duration(days: 7))
          : DateTime.now().add(const Duration(days: 7)),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      oldPrice: json['originalPrice'] != null
          ? double.tryParse(json['originalPrice'].toString())
          : (json['oldPrice'] != null ? double.tryParse(json['oldPrice'].toString()) : null),
      newPrice: json['newPrice'] != null ? double.tryParse(json['newPrice'].toString()) : null,
      rejectionReason: json['rejectionReason']?.toString(),
      viewCount: json['viewCount'] ?? 0,
      isFeatured: json['isFeatured'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'status': status,
      'imageUrl': imageUrl,
      'images': images,
      'storeName': storeName,
      'merchantId': merchantId,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'originalPrice': oldPrice,
      'newPrice': newPrice,
      'rejectionReason': rejectionReason,
      'viewCount': viewCount,
      'isFeatured': isFeatured,
    };
  }
}