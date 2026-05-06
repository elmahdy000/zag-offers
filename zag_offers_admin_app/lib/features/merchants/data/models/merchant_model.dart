import 'package:zag_offers_admin_app/core/utils/image_url_helper.dart';
import 'package:zag_offers_admin_app/features/merchants/domain/entities/merchant.dart';

class MerchantModel extends Merchant {
  const MerchantModel({
    required super.id,
    required super.storeName,
    required super.ownerName,
    required super.phone,
    required super.status,
    super.logoUrl,
    super.category,
    required super.createdAt,
  });

  factory MerchantModel.fromJson(Map<String, dynamic> json) {
    return MerchantModel(
      id: json['id']?.toString() ?? '',
      storeName: json['name'] ?? json['storeName'] ?? '',
      ownerName: json['owner']?['name'] ?? json['ownerName'] ?? '',
      phone: json['phone'] ?? '',
      status: json['status'] ?? 'PENDING',
      logoUrl: ImageUrlHelper.resolveNullable(json['logo']?.toString() ?? json['logoUrl']?.toString()),
      category: json['category']?['name'] ?? json['category'],
      createdAt: json['createdAt'] != null
          ? (DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now())
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'storeName': storeName,
      'ownerName': ownerName,
  