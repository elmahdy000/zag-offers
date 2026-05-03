import 'package:equatable/equatable.dart';

class ReviewEntity extends Equatable {
  final String id;
  final int rating;
  final String? comment;
  final String customerName;
  final DateTime createdAt;

  const ReviewEntity({
    required this.id,
    required this.rating,
    this.comment,
    required this.customerName,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, rating, comment, customerName, createdAt];
}
