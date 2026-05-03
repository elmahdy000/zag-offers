import '../../domain/entities/dashboard_stats_entity.dart';

class DashboardStatsModel extends DashboardStatsEntity {
  const DashboardStatsModel({
    required super.activeOffers,
    required super.scansToday,
    required super.recentCoupons,
  });

  factory DashboardStatsModel.fromJson(Map<String, dynamic> json) {
    return DashboardStatsModel(
      activeOffers: json['activeOffers'] ?? 0,
      scansToday: json['scansToday'] ?? 0,
      recentCoupons: (json['recentCoupons'] as List<dynamic>?)
              ?.map((e) => RecentCouponModel.fromJson(e))
              .toList() ??
          [],
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
      id: json['id'] ?? '',
      code: json['code'] ?? '',
      redeemedAt: json['redeemedAt'] != null 
          ? DateTime.parse(json['redeemedAt']) 
          : DateTime.now(),
      offerTitle: json['offer']?['title'] ?? '',
      customerName: json['customer']?['name'] ?? '',
    );
  }
}
