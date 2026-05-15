import 'package:equatable/equatable.dart';

class StoreEntity extends Equatable {
  final String id;
  final String name;
  final String? logo;
  final String? coverImage;
  final String address;
  final String? area;
  final String phone;
  final String? whatsapp;
  final String categoryId;
  final String? categoryName;
  final List<String> images;
  final String status;

  const StoreEntity({
    required this.id,
    required this.name,
    this.logo,
    this.coverImage,
    required this.address,
    this.area,
    required this.phone,
    this.whatsapp,
    required this.categoryId,
    this.categoryName,
    this.images = const [],
    this.status = 'PENDING',
  });

  @override
  List<Object?> get props => [
        id,
        name,
        logo,
        coverImage,
        address,
        area,
        phone,
        whatsapp,
        categoryId,
        categoryName,
        images,
        status,
      ];
}
