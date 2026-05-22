import 'package:equatable/equatable.dart';
import '../../../../core/utils/image_url_helper.dart';

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

  NotificationItemEntity copyWith({bool? isRead}) {
    return NotificationItemEntity(
      id: id,
      title: title,
      message: message,
      createdAt: createdAt,
      isRead: isRead ?? this.isRead,
      type: type,
      imageUrl: imageUrl,
      data: data,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'message': message,
        'createdAt': createdAt.toIso8601String(),
        'isRead': isRead,
        'type': type,
        'imageUrl': imageUrl,
        'data': data,
      };

  factory NotificationItemEntity.fromJson(Map<String, dynamic> json) {
    return NotificationItemEntity(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? json['body'] ?? '',
      createdAt: DateTime.parse(json['createdAt']),
      isRead: json['isRead'] ?? false,
      type: json['type'],
      imageUrl: ImageUrlHelper.resolveNullable(json['imageUrl']?.toString()),
      data: json['data'] is Map ? Map<String, dynamic>.from(json['data']) : null,
    );
  }

  @override
  List<Object?> get props => [id, title, message, createdAt, isRead, type, imageUrl, data];
}
