import 'package:equatable/equatable.dart';

class StoreEntity extends Equatable {
  final String id;
  final String name;
  final String? logo;
  final String? category;  // اختياري — مش موجود في كل الـ responses (مثلاً داخل قائمة العروض)
  final String area;
  final double rating;     // مش في الداتابيز حالياً، بنحطها 0.0 default
  final double? latitude;
  final double? longitude;

  final String? phone;
  final String? whatsapp;

  const StoreEntity({
    required this.id,
    required this.name,
    this.logo,
    this.category,
    required this.area,
    this.rating = 0.0,
    this.latitude,
    this.longitude,
    this.phone,
    this.whatsapp,
  });

  @override
  List<Object?> get props => [id, name, logo, category, area, rating, latitude, longitude, phone, whatsapp];
}

