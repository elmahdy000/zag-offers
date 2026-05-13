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

  final List<TopOfferEntity> topOffers;

  const DashboardStatsEntity({
    required this.activeOffers,
    required this.scansToday,
    required this.claimsToday,
    required this.totalClaims,
    required this.recentCoupons,
    this.topOffers = const [],
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
        topOffers,
        storeName,
        storeId,
        storeStatus
      ];
}

class TopOfferEntity extends Equatable {
  final String id;
  final String title;
  final String discount;
  final int views;
  final int claims;

  const TopOfferEntity({
    required this.id,
    required this.title,
    required this.discount,
    required this.views,
    required this.claims,
  });

  @override
  List<Object?> get props => [id, title, discount, views, claims];
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
