import '../../domain/entities/dashboard_stats_entity.dart';

class DashboardStatsModel extends DashboardStatsEntity {
  const DashboardStatsModel({
    required super.activeOffers,
    required super.scansToday,
    required super.recentCoupons,
    super.storeName,
    super.storeId,
    super.storeStatus,
  });

  factory DashboardStatsModel.fromJson(Map<String, dynamic> json) {
    return DashboardStatsModel(
      activeOffers: (json['activeOffers'] as int?) ?? 0,
      scansToday: (json['scansToday'] as int?) ?? 0,
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
    required super.redeemedAt,
    required super.offerTitle,
    required super.customerName,
  });

  factory RecentCouponModel.fromJson(Map<String, dynamic> json) {
    return RecentCouponModel(
      id: json['id']?.toString() ?? '',
      code: json['code']?.toString() ?? '',
      redeemedAt: json['redeemedAt'] != null
          ? (DateTime.tryParse(json['redeemedAt'].toString()) ?? DateTime.now())
          : DateTime.now(),
      offerTitle: json['offer']?['title']?.toString() ?? '',
      customerName: json['customer']?['name']?.toString() ?? '',
    );
  }
}
