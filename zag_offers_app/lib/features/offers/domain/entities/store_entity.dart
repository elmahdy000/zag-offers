import 'package:equatable/equatable.dart';

class StoreEntity extends Equatable {
  final String id;
  final String name;
  final String? logo;
  final String? coverImage;
  final String? category;
  final String area;
  final double rating;
  final double? latitude;
  final double? longitude;
  final List<String>? images;

  final String? phone;
  final String? whatsapp;
  final String? address;
  final String? locationUrl;
  final String? workingHours;

  const StoreEntity({
    required this.id,
    required this.name,
    this.logo,
    this.coverImage,
    this.category,
    required this.area,
    this.rating = 0.0,
    this.latitude,
    this.longitude,
    this.images,
    this.phone,
    this.whatsapp,
    this.address,
    this.locationUrl,
    this.workingHours,
  });

  @override
  List<Object?> get props => [
        id,
        name,
        logo,
        coverImage,
        category,
        area,
        rating,
        latitude,
        longitude,
        images,
        phone,
        whatsapp,
        address,
        locationUrl,
        workingHours,
      ];
}

