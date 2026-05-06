import 'package:zag_offers_admin_app/features/coupons/domain/entities/coupon.dart';

class CouponModel extends Coupon {
  const CouponModel({
    required super.id,
    required super.code,
    required super.status,
    required super.createdAt,
    required super.customerName,
    required super.storeName,
    required super.offerTitle,
  });

  factory CouponModel.fromJson(Map<String, dynamic> json) {
    return CouponModel(
      id: json['id'] ?? '',
      code: json['code'] ?? '',
      status: json['status'] ?? 'GENERATED',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      customerName: json['customer']?['name'] ?? 'Unknown Customer',
      storeName: json['offer']?['store']?['name'] ?? 'Unknown Store',
      offerTitle: json['offer']?['title'] ?? 'Unknown Offer',
    );
  }
}
