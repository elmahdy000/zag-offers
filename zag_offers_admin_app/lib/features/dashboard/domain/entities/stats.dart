import 'package:equatable/equatable.dart';

class DashboardStats extends Equatable {
  final int totalMerchants;
  final int pendingMerchants;
  final int totalUsers;
  final int activeOffers;

  const DashboardStats({
    required this.totalMerchants,
    required this.pendingMerchants,
    required this.totalUsers,
    required this.activeOffers,
  });

  @override
  List<Object?> get props => [
    totalMerchants,
    pendingMerchants,
    totalUsers,
    activeOffers,
  ];
}
