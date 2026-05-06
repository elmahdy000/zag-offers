import 'package:zag_offers_admin_app/features/users/domain/entities/app_user_details.dart';

class UserDetailsModel extends AppUserDetails {
  const UserDetailsModel({
    required super.id,
    required super.name,
    required super.phone,
    super.email,
    required super.createdAt,
    required super.points,
    required super.role,
    super.area,
    super.avatar,
    required super.storesCount,
    required super.couponsCount,
    required super.favoritesCount,
    required super.reviewsCount,
    required super.stores,
    required super.recentCoupons,
  });

  factory UserDetailsModel.fromJson(Map<String, dynamic> json) {
    final counts = Map<String, dynamic>.from(json['_count'] ?? {});

    final storesRaw = json['stores'] is List ? json['stores'] as List : const [];
    final couponsRaw = json['coupons'] is List ? json['coupons'] as List : const [];

    return UserDetailsModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      email: json['email']?.toString(),
      createdAt: json['createdAt'] != null
          ? (DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now())
          : DateTime.now(),
      points: (json['points'] is int)
          ? json['points']
          : (int.tryParse(json['points']?.toString() ?? '0') ?? 0),
      role: json['role']?.toString() ?? 'CUSTOMER',
      area: json['area']?.toString(),
      avatar: json['avatar']?.toString(),
      storesCount: _toInt(counts['stores']),
      couponsCount: _toInt(counts['coupons']),
      favoritesCount: _toInt(counts['favorites']),
      reviewsCount: _toInt(counts['reviews']),
      stores: storesRaw.map((s) {
        final store = Map<String, dynamic>.from(s as Map);
        final storeCount = Map<String, dynamic>.from(store['_count'] ?? {});
        return UserStoreSummary(
          id: store['id']?.toString() ?? '',
          name: store['name']?.toString() ?? '',
          status: store['status']?.toString() ?? '-',
          offersCount: _toInt(storeCount['offers']),
        );
      }).toList(),
      recentCoupons: couponsRaw.map((c) {
        final coupon = Map<String, dynamic>.from(c as Map);
        final offer = coupon['offer'] is Map
            ? Map<String, dynamic>.from(coupon['offer'] as Map)
            : const <String, dynamic>{};
        return UserCouponSummary(
          id: coupon['id']?.toString() ?? '',
          code: coupon['code']?.toString() ?? '',
          status: coupon['status']?.toString() ?? '-',
          createdAt: coupon['createdAt'] != null
              ? (DateTime.tryParse(coupon['createdAt'].toString()) ?? DateTime.now())
              : DateTime.now(),
          offerTitle: offer['title']?.toString(),
        );
      }).toList(),
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '0') ?? 0;
  }
}
