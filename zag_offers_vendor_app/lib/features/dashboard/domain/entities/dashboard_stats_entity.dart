import 'package:equatable/equatable.dart';

class DashboardStatsEntity extends Equatable {
  final int activeOffers;
  final int scansToday;
  final List<RecentCouponEntity> recentCoupons;

  const DashboardStatsEntity({
    required this.activeOffers,
    required this.scansToday,
    required this.recentCoupons,
  });

  @override
  List<Object?> get props => [activeOffers, scansToday, recentCoupons];
}

class RecentCouponEntity extends Equatable {
  final String id;
  final String code;
  final DateTime redeemedAt;
  final String offerTitle;
  final String customerName;

  const RecentCouponEntity({
    required this.id,
    required this.code,
    required this.redeemedAt,
    required this.offerTitle,
    required this.customerName,
  });

  @override
  List<Object?> get props => [id, code, redeemedAt, offerTitle, customerName];
}
