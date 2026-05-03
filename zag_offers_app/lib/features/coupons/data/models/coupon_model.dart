import 'package:zag_offers_app/features/coupons/domain/entities/coupon_entity.dart';
import 'package:zag_offers_app/features/offers/data/models/offer_model.dart';

class CouponModel extends CouponEntity {
  const CouponModel({
    required super.id,
    required super.code,
    required super.status,
    required super.createdAt,
    super.expiresAt,
    required super.offer,
  });

  factory CouponModel.fromJson(Map<String, dynamic> json) {
    return CouponModel(
      id: json['id']?.toString() ?? '',
      code: json['code'] ?? '',
      status: json['status'] ?? 'GENERATED',
      createdAt: _parseDate(json['createdAt']) ?? DateTime.now(),
      expiresAt: _parseDate(json['expiresAt']),
      offer: OfferModel.fromJson(json['offer'] ?? {}),
    );
  }

  static DateTime? _parseDate(dynamic val) {
    if (val == null) return null;
    return DateTime.tryParse(val.toString());
  }
}
