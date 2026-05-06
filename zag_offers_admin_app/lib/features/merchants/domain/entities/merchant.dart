import 'package:equatable/equatable.dart';

class Merchant extends Equatable {
  final String id;
  final String storeName;
  final String ownerName;
  final String phone;
  final String status; // PENDING, APPROVED, REJECTED
  final String? logoUrl;
  final String? category;
  final DateTime createdAt;

  const Merchant({
    required this.id,
    required this.storeName,
    required this.ownerName,
    required this.phone,
    required this.status,
    this.logoUrl,
    this.category,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
    id,
    storeName,
    ownerName,
    phone,
    status,
    logoUrl,
    category,
    createdAt,
  ];
}
