import 'package:equatable/equatable.dart';

class Offer extends Equatable {
  final String id;
  final String title;
  final String description;
  final String status; // PENDING, APPROVED, REJECTED, EXPIRED
  final String? imageUrl;
  final List<String> images;
  final String storeName;
  final String merchantId;
  final DateTime startDate;
  final DateTime endDate;
  final DateTime createdAt;
  final double? oldPrice;
  final double? newPrice;
  final String? rejectionReason;
  final int viewCount;
  final bool isFeatured;

  const Offer({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    this.imageUrl,
    this.images = const [],
    required this.storeName,
    required this.merchantId,
    required this.startDate,
    required this.endDate,
    required this.createdAt,
    this.oldPrice,
    this.newPrice,
    this.rejectionReason,
    this.viewCount = 0,
    this.isFeatured = false,
  });

  @override
  List<Object?> get props => [
    id,
    title,
    description,
    status,
    imageUrl,
    images,
    storeName,
    merchantId,
    startDate,
    endDate,
    createdAt,
    oldPrice,
    newPrice,
    rejectionReason,
    viewCount,
    isFeatured,
  ];
}
