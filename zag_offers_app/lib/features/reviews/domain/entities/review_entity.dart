import 'package:equatable/equatable.dart';

class ReviewEntity extends Equatable {
  final String id;
  final int rating;
  final String? comment;
  final String customerName;
  final String? customerAvatar;
  final String? merchantReply;
  final DateTime? replyCreatedAt;
  final DateTime createdAt;

  const ReviewEntity({
    required this.id,
    required this.rating,
    this.comment,
    required this.customerName,
    this.customerAvatar,
    this.merchantReply,
    this.replyCreatedAt,
    required this.createdAt,
  });

  ReviewEntity copyWith({
    String? id,
    int? rating,
    String? comment,
    String? customerName,
    String? customerAvatar,
    String? merchantReply,
    DateTime? replyCreatedAt,
    DateTime? createdAt,
  }) {
    return ReviewEntity(
      id: id ?? this.id,
      rating: rating ?? this.rating,
      comment: comment ?? this.comment,
      customerName: customerName ?? this.customerName,
      customerAvatar: customerAvatar ?? this.customerAvatar,
      merchantReply: merchantReply ?? this.merchantReply,
      replyCreatedAt: replyCreatedAt ?? this.replyCreatedAt,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  List<Object?> get props => [id, rating, comment, customerName, customerAvatar, merchantReply, replyCreatedAt, createdAt];
}
