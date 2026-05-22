import 'package:equatable/equatable.dart';
import 'store_entity.dart';

enum OfferStatus { active, expired, redeemed }

extension OfferStatusX on String {
  OfferStatus toOfferStatus() {
    switch (toUpperCase()) {
      case 'ACTIVE':
        return OfferStatus.active;
      case 'EXPIRED':
        return OfferStatus.expired;
      case 'REDEEMED':
        return OfferStatus.redeemed;
      default:
        return OfferStatus.active;
    }
  }
}

class OfferEntity extends Equatable {
  final String id;
  final String title;
  final String? description;
  final String? image;
  final List<String>? images;
  final String discount;
  final DateTime expiryDate;
  final StoreEntity store;
  final String? terms;
  final double? oldPrice;
  final double? newPrice;
  final int viewCount;
  final int usedCoupons;
  final int? usageLimit;
  final bool isFeatured;
  final OfferStatus status;
  final bool isFlashSale;
  final DateTime? flashSaleEndsAt;

  const OfferEntity({
    required this.id,
    required this.title,
    this.description,
    this.image,
    this.images,
    required this.discount,
    required this.expiryDate,
    required this.store,
    this.terms,
    this.oldPrice,
    this.newPrice,
    this.viewCount = 0,
    this.usedCoupons = 0,
    this.usageLimit,
    this.isFeatured = false,
    this.status = OfferStatus.active,
    this.isFlashSale = false,
    this.flashSaleEndsAt,
  });

  factory OfferEntity.fromRaw({
    required String id,
    required String title,
    String? description,
    String? image,
    List<String>? images,
    required String discount,
    required DateTime expiryDate,
    required StoreEntity store,
    String? terms,
    double? oldPrice,
    double? newPrice,
    int viewCount = 0,
    int usedCoupons = 0,
    int? usageLimit,
    bool isFeatured = false,
    String status = 'ACTIVE',
    bool isFlashSale = false,
    DateTime? flashSaleEndsAt,
  }) {
    return OfferEntity(
      id: id,
      title: title,
      description: description,
      image: image,
      images: images,
      discount: discount,
      expiryDate: expiryDate,
      store: store,
      terms: terms,
      oldPrice: oldPrice,
      newPrice: newPrice,
      viewCount: viewCount,
      usedCoupons: usedCoupons,
      usageLimit: usageLimit,
      isFeatured: isFeatured,
      status: status.toOfferStatus(),
      isFlashSale: isFlashSale,
      flashSaleEndsAt: flashSaleEndsAt,
    );
  }

  double get discountPercentage {
    const arabicIndic = '٠١٢٣٤٥٦٧٨٩';
    const ascii = '0123456789';
    String normalized = discount;
    for (int i = 0; i < arabicIndic.length; i++) {
      normalized = normalized.replaceAll(arabicIndic[i], ascii[i]);
    }
    final match = RegExp(r'\d+').firstMatch(normalized);
    return match != null ? double.tryParse(match.group(0)!) ?? 0.0 : 0.0;
  }

  @override
  List<Object?> get props => [
        id,
        title,
        description,
        image,
        images,
        discount,
        expiryDate,
        store,
        terms,
        oldPrice,
        newPrice,
        viewCount,
        usedCoupons,
        usageLimit,
        isFeatured,
        status,
      ];
}
