import 'package:equatable/equatable.dart';

class OfferEntity extends Equatable {
  final String id;
  final String title;
  final String description;
  final List<String> images;
  final String discount;
  final String? terms;
  final DateTime startDate;
  final DateTime endDate;
  final int? usageLimit;
  final String status;
  final String storeId;
  final double? oldPrice;
  final double? newPrice;
  final String? rejectionReason;
  final int viewCount;
  final int couponsCount;
  final bool isFeatured;

  const OfferEntity({
    required this.id,
    required this.title,
    required this.description,
    required this.images,
    required this.discount,
    this.terms,
    required this.startDate,
    required this.endDate,
    this.usageLimit,
    required this.status,
    required this.storeId,
    this.oldPrice,
    this.newPrice,
    this.rejectionReason,
    this.viewCount = 0,
    this.couponsCount = 0,
    this.isFeatured = false,
  });

  @override
  List<Object?> get props => [
        id,
        title,
        description,
        images,
        discount,
        terms,
        startDate,
        endDate,
        usageLimit,
        status,
        storeId,
        oldPrice,
        newPrice,
        rejectionReason,
        viewCount,
        couponsCount,
        isFeatured,
      ];
}
