import 'package:equatable/equatable.dart';

class NotificationEntity extends Equatable {
  final String id;
  final String title;
  final String body;
  final String? imageUrl;
  final String? type;
  final Map<String, dynamic>? data;
  final bool isRead;
  final DateTime createdAt;

  const NotificationEntity({
    required this.id,
    required this.title,
    required this.body,
    this.imageUrl,
    this.type,
    this.data,
    required this.isRead,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, title, body, imageUrl, type, data, isRead, createdAt];
}
