import '../../domain/entities/dashboard_stats_entity.dart';

class DashboardStatsModel extends DashboardStatsEntity {
  const DashboardStatsModel({
    required super.activeOffers,
    required super.scansToday,
    required super.claimsToday,
    required super.totalClaims,
    required super.recentCoupons,
    super.storeName,
    super.storeId,
    super.storeStatus,
  });

  factory DashboardStatsModel.fromJson(Map<String, dynamic> json) {
    return DashboardStatsModel(
      activeOffers: (json['activeOffers'] as int?) ?? 0,
      scansToday: (json['scansToday'] as int?) ?? 0,
      claimsToday: (json['claimsToday'] as int?) ?? 0,
      totalClaims: (json['totalClaims'] as int?) ?? 0,
      storeName: json['storeName']?.toString(),
      storeId: json['storeId']?.toString(),
      storeStatus: json['storeStatus']?.toString(),
      recentCoupons: json['recentCoupons'] is List
          ? (json['recentCoupons'] as List)
              .whereType<Map<String, dynamic>>()
              .map((e) => RecentCouponModel.fromJson(e))
              .toList()
          : [],
    );
  }
}

class RecentCouponModel extends RecentCouponEntity {
  const RecentCouponModel({
    required super.id,
    required super.code,
    required super.status,
    required super.createdAt,
    super.redeemedAt,
    required super.offerTitle,
    required super.customerName,
  });

  factory RecentCouponModel.fromJson(Map<String, dynamic> json) {
    return RecentCouponModel(
      id: json['id']?.toString() ?? '',
      code: json['code']?.toString() ?? '',
      status: json['status']?.toString() ?? 'PENDING',
      createdAt: json['createdAt'] != null
          ? (DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now())
          : DateTime.now(),
      redeemedAt: json['redeemedAt'] != null
          ? DateTime.tryParse(json['redeemedAt'].toString())
          : null,
      offerTitle: json['offerTitle']?.toString() ??
          (json['offer']?['title']?.toString() ?? ''),
      customerName: json['customerName']?.toString() ??
          (json['customer']?['name']?.toString() ?? ''),
    );
  }
}
