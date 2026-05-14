import 'package:equatable/equatable.dart';

class NotificationItemEntity extends Equatable {
  final String id;
  final String title;
  final String message;
  final DateTime createdAt;
  final bool isRead;

  final String? type;
  final String? imageUrl;
  final Map<String, dynamic>? data;

  const NotificationItemEntity({
    required this.id,
    required this.title,
    required this.message,
    required this.createdAt,
    required this.isRead,
    this.type,
    this.imageUrl,
    this.data,
  });

  @override
  List<Object?> get props => [id, title, message, createdAt, isRead, type, imageUrl, data];
}
