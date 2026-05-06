import '../../domain/entities/review_entity.dart';

class ReviewModel extends ReviewEntity {
  const ReviewModel({
    required super.id,
    required super.rating,
    super.comment,
    required super.customerName,
    required super.createdAt,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    return ReviewModel(
      id: json['id'] ?? '',
      rating: json['rating'] ?? 0,
      comment: json['comment'],
      customerName: json['customer'] != null ? json['customer']['name'] ?? 'مستخدم' : 'مستخدم',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}
