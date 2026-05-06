import 'package:equatable/equatable.dart';
import 'package:zag_offers_admin_app/features/users/domain/entities/app_user.dart';

class UserStoreSummary extends Equatable {
  final String id;
  final String name;
  final String status;
  final int offersCount;

  const UserStoreSummary({
    required this.id,
    required this.name,
    required this.status,
    required this.offersCount,
  });

  @override
  List<Object?> get props => [id, name, status, offersCount];
}

class UserCouponSummary extends Equatable {
  final String id;
  final String code;
  final String status;
  final DateTime createdAt;
  final String? offerTitle;

  const UserCouponSummary({
    required this.id,
    required this.code,
    required this.status,
    required this.createdAt,
    this.offerTitle,
  });

  @override
  List<Object?> get props => [id, code, status, createdAt, offerTitle];
}

class AppUserDetails extends AppUser {
  final String role;
  final String? area;
  final String? avatar;
  final int storesCount;
  final int couponsCount;
  final int favoritesCount;
  final int reviewsCount;
  final List<UserStoreSummary> stores;
  final List<UserCouponSummary> recentCoupons;

  const AppUserDetails({
    required super.id,
    required super.name,
    required super.phone,
    super.email,
    required super.createdAt,
    required super.points,
    required this.role,
    this.area,
    this.avatar,
    required this.storesCount,
    required this.couponsCount,
    required this.favoritesCount,
    required this.reviewsCount,
    required this.stores,
    required this.recentCoupons,
  });

  @override
  List<Object?> get props => [
    ...super.props,
    role,
    area,
    avatar,
    storesCount,
    couponsCount,
    favoritesCount,
    reviewsCount,
    stores,
    recentCoupons,
  ];
}
