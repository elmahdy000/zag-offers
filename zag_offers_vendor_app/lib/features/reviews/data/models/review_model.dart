import '../../domain/entities/review_entity.dart';

class ReviewModel extends ReviewEntity {
  const ReviewModel({
    required super.id,
    required super.rating,
    super.comment,
    super.merchantReply,
    super.replyCreatedAt,
    required super.customerName,
    super.customerAvatar,
    required super.createdAt,
    super.offerId,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    return ReviewModel(
      id: json['id'] as String,
      rating: json['rating'] as int,
      comment: json['comment'] as String?,
      merchantReply: json['merchantReply'] as String?,
      replyCreatedAt: json['replyCreatedAt'] as String?,
      customerName: json['customer'] != null
          ? (json['customer']['name'] as String? ?? '')
          : '',
      customerAvatar: json['customer'] != null
          ? json['customer']['avatar'] as String?
          : null,
      createdAt: json['createdAt'] as String,
      offerId: json['offerId'] as String?,
    );
  }
}
