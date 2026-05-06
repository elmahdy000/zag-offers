import 'package:flutter/foundation.dart';
import 'package:zag_offers_admin_app/features/dashboard/domain/entities/stats.dart';

class StatsModel extends DashboardStats {
  const StatsModel({
    required super.totalMerchants,
    required super.pendingMerchants,
    required super.totalUsers,
    required super.activeOffers,
  });

  factory StatsModel.fromJson(dynamic json) {
    try {
      if (json is! Map) {
        return const StatsModel(
          totalMerchants: 0,
          pendingMerchants: 0,
          totalUsers: 0,
          activeOffers: 0,
        );
      }

      final users = json['users'] is Map ? json['users'] as Map : {};
      final stores = json['stores'] is Map ? json['stores'] as Map : {};
      final offers = json['offers'] is Map ? json['offers'] as Map : {};

      final model = StatsModel(
        totalMerchants: _toInt(
          users['totalMerchants'] ?? json['totalMerchants'],
        ),
        pendingMerchants: _toInt(
          stores['pendingStores'] ?? json['pendingMerchants'],
        ),
        totalUsers: _toInt(users['totalUsers'] ?? json['totalUsers']),
        activeOffers: _toInt(offers['activeOffers'] ?? json['activeOffers']),
      );
      return model;
    } catch (e) {
      debugPrint('StatsModel parsing error: $e');
      return const StatsModel(
        totalMerchants: 0,
        pendingMerchants: 0,
        totalUsers: 0,
        activeOffers: 0,
      );
    }
  }

  static int _toInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    // If it's a Map or something else, we return 0 instead of crashing
    return 0;
  }
}
