import 'package:equatable/equatable.dart';

class Coupon extends Equatable {
  final String id;
  final String code;
  final String status;
  final DateTime createdAt;
  final String customerName;
  final String storeName;
  final String offerTitle;

  const Coupon({
    required this.id,
    required this.code,
    required this.status,
    required this.createdAt,
    required this.customerName,
    required this.storeName,
    required this.offerTitle,
  });

  @override
  List<Object?> get props => [
    id,
    code,
    status,
    createdAt,
    customerName,
    storeName,
    offerTitle,
  ];
}
