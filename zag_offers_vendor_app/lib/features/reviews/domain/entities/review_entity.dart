class ReviewEntity {
  final String id;
  final int rating;
  final String? comment;
  final String? merchantReply;
  final String? replyCreatedAt;
  final String customerName;
  final String? customerAvatar;
  final String createdAt;
  final String? offerId;

  const ReviewEntity({
    required this.id,
    required this.rating,
    this.comment,
    this.merchantReply,
    this.replyCreatedAt,
    required this.customerName,
    this.customerAvatar,
    required this.createdAt,
    this.offerId,
  });
}
