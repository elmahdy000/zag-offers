import 'package:equatable/equatable.dart';

class DashboardStatsEntity extends Equatable {
  final int activeOffers;
  final int scansToday;
  final int claimsToday;
  final int totalClaims;
  final List<RecentCouponEntity> recentCoupons;
  final String? storeName;
  final String? storeId;
  final String? storeStatus;

  const DashboardStatsEntity({
    required this.activeOffers,
    required this.scansToday,
    required this.claimsToday,
    required this.totalClaims,
    required this.recentCoupons,
    this.storeName,
    this.storeId,
    this.storeStatus,
  });

  @override
  List<Object?> get props => [
        activeOffers,
        scansToday,
        claimsToday,
        totalClaims,
        recentCoupons,
        storeName,
        storeId,
        storeStatus
      ];
}

class RecentCouponEntity extends Equatable {
  final String id;
  final String code;
  final String status;
  final DateTime createdAt;
  final DateTime? redeemedAt;
  final String offerTitle;
  final String customerName;

  const RecentCouponEntity({
    required this.id,
    required this.code,
    required this.status,
    required this.createdAt,
    this.redeemedAt,
    required this.offerTitle,
    required this.customerName,
  });

  @override
  List<Object?> get props =>
      [id, code, status, createdAt, redeemedAt, offerTitle, customerName];
}
