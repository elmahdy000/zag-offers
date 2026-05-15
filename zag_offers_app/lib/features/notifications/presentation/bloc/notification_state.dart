import 'package:equatable/equatable.dart';
import '../../domain/entities/notification_item_entity.dart';

abstract class NotificationState extends Equatable {
  @override
  List<Object?> get props => [];
}

class NotificationFeedState extends NotificationState {
  final List<NotificationItemEntity> items;
  final NotificationItemEntity? latestItem;
  final bool isLoading;
  final String? error;

  NotificationFeedState({
    required this.items,
    this.latestItem,
    this.isLoading = false,
    this.error,
  });

  NotificationFeedState copyWith({
    List<NotificationItemEntity>? items,
    NotificationItemEntity? latestItem,
    bool clearLatest = false,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return NotificationFeedState(
      items: items ?? this.items,
      latestItem: clearLatest ? null : (latestItem ?? this.latestItem),
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }

  @override
  List<Object?> get props => [items, latestItem, isLoading, error];
}
