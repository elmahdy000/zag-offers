import 'package:equatable/equatable.dart';
import 'store_entity.dart';

class OfferEntity extends Equatable {
  final String id;
  final String title;
  final String? description;
  final String? image;
  final List<String>? images;
  final String discount;           // النص الخام من الباك-إيند ("20%", "BOGO", إلخ)
  final double discountPercentage; // قيمة رقمية للعرض في الـ UI (مشتقة من discount)
  final DateTime expiryDate;
  final StoreEntity store;

  const OfferEntity({
    required this.id,
    required this.title,
    this.description,
    this.image,
    this.images,
    required this.discount,
    required this.discountPercentage,
    required this.expiryDate,
    required this.store,
  });

  @override
  List<Object?> get props => [id, title, description, image, images, discount, discountPercentage, expiryDate, store];
}
