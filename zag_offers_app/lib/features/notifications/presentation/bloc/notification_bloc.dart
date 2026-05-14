import 'dart:convert';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../domain/repositories/notifications_repository.dart';
import '../../domain/entities/notification_item_entity.dart';

abstract class NotificationEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class LoadNotifications extends NotificationEvent {
  final bool fromServer;
  LoadNotifications({this.fromServer = false});
  @override
  List<Object?> get props => [fromServer];
}

class NewSocialProofReceived extends NotificationEvent {
  final String storeName;
  final String offerTitle;

  NewSocialProofReceived({
    required this.storeName,
    required this.offerTitle,
  });

  @override
  List<Object?> get props => [storeName, offerTitle];
}

class ClearLatestNotification extends NotificationEvent {}

class ClearAllNotifications extends NotificationEvent {}

class GeneralNotificationReceived extends NotificationEvent {
  final String title;
  final String body;

  GeneralNotificationReceived({required this.title, required this.body});

  @override
  List<Object?> get props => [title, body];
}

class MarkAsRead extends NotificationEvent {
  final String notificationId;
  MarkAsRead(this.notificationId);
  @override
  List<Object?> get props => [notificationId];
}

class NotificationItem extends Equatable {
  final String id;
  final String title;
  final String message;
  final DateTime createdAt;
  final bool isRead;
  final String? type;
  final String? imageUrl;
  final Map<String, dynamic>? data;

  const NotificationItem({
    required this.id,
    required this.title,
    required this.message,
    required this.createdAt,
    this.isRead = false,
    this.type,
    this.imageUrl,
    this.data,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'message': message,
        'createdAt': createdAt.toIso8601String(),
        'isRead': isRead,
        'type': type,
        'imageUrl': imageUrl,
        'data': data != null ? jsonEncode(data) : null,
      };

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic>? extraData;
    if (json['data'] != null) {
      if (json['data'] is Map) {
        extraData = Map<String, dynamic>.from(json['data']);
      } else if (json['data'] is String) {
        try {
          extraData = jsonDecode(json['data']);
        } catch (_) {}
      }
    }

    return NotificationItem(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? json['body'] ?? '',
      createdAt: DateTime.parse(json['createdAt']),
      isRead: json['isRead'] ?? false,
      type: json['type'],
      imageUrl: json['imageUrl'],
      data: extraData,
    );
  }

  NotificationItem copyWith({bool? isRead}) {
    return NotificationItem(
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

  @override
  List<Object?> get props => [id, title, message, createdAt, isRead, type, imageUrl, data];
}

abstract class NotificationState extends Equatable {
  @override
  List<Object?> get props => [];
}

class NotificationFeedState extends NotificationState {
  final List<NotificationItem> items;
  final NotificationItem? latestItem;
  final bool isLoading;
  final String? error;

  NotificationFeedState({
    required this.items,
    this.latestItem,
    this.isLoading = false,
    this.error,
  });

  NotificationFeedState copyWith({
    List<NotificationItem>? items,
    NotificationItem? latestItem,
    bool clearLatest = false,
    bool? isLoading,
    String? error,
  }) {
    return NotificationFeedState(
      items: items ?? this.items,
      latestItem: clearLatest ? null : (latestItem ?? this.latestItem),
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }

  @override
  List<Object?> get props => [items, latestItem, isLoading, error];
}

class NotificationBloc extends Bloc<NotificationEvent, NotificationState> {
  static const String _storageKey = 'notifications_history';
  final NotificationsRepository repository;

  NotificationBloc({required this.repository}) : super(NotificationFeedState(items: const [])) {
    on<LoadNotifications>(_onLoadNotifications);
    on<NewSocialProofReceived>(_onNewSocialProofReceived);
    on<ClearLatestNotification>(_onClearLatestNotification);
    on<GeneralNotificationReceived>(_onGeneralNotificationReceived);
    on<ClearAllNotifications>(_onClearAllNotifications);
    on<MarkAsRead>(_onMarkAsRead);
    
    // Initial load
    add(LoadNotifications(fromServer: true));
  }

  Future<void> _onLoadNotifications(
    LoadNotifications event,
    Emitter<NotificationState> emit,
  ) async {
    // 1. Load from local first for instant UI
    if (state is! NotificationFeedState || (state as NotificationFeedState).items.isEmpty) {
      try {
        final prefs = await SharedPreferences.getInstance();
        final String? data = prefs.getString(_storageKey);
        if (data != null) {
          final List<dynamic> decoded = json.decode(data);
          final items = decoded.map((e) => NotificationItem.fromJson(e)).toList();
          emit(NotificationFeedState(items: items));
        }
      } catch (_) {}
    }

    // 2. Load from server if requested
    if (event.fromServer) {
      final currentState = state is NotificationFeedState ? (state as NotificationFeedState) : NotificationFeedState(items: const []);
      emit(currentState.copyWith(isLoading: true));
      
      final result = await repository.getNotifications();
      result.fold(
        (failure) => emit(currentState.copyWith(isLoading: false, error: failure.message)),
        (serverNotifications) async {
          final items = serverNotifications.map((n) => NotificationItem(
            id: n.id,
            title: n.title,
            message: n.message,
            createdAt: n.createdAt,
            isRead: n.isRead,
            type: n.type,
            imageUrl: n.imageUrl,
            data: n.data,
          )).toList();
          
          emit(NotificationFeedState(items: items, isLoading: false));
          await _saveToStorage(items);
        },
      );
    }
  }

  Future<void> _onNewSocialProofReceived(
    NewSocialProofReceived event,
    Emitter<NotificationState> emit,
  ) async {
    final currentState = state is NotificationFeedState
        ? state as NotificationFeedState
        : NotificationFeedState(items: const []);

    final item = NotificationItem(
      id: 'local_${DateTime.now().millisecondsSinceEpoch}',
      title: 'تنبيه مباشر',
      message:
          'شخص ما حصل للتو على عرض "${event.offerTitle}" من ${event.storeName}',
      createdAt: DateTime.now(),
      isRead: false,
    );

    final newItems = [item, ...currentState.items];
    emit(
      currentState.copyWith(
        items: newItems,
        latestItem: item,
      ),
    );
    await _saveToStorage(newItems);
  }

  void _onClearLatestNotification(
    ClearLatestNotification event,
    Emitter<NotificationState> emit,
  ) {
    if (state is! NotificationFeedState) return;
    emit((state as NotificationFeedState).copyWith(clearLatest: true));
  }

  Future<void> _onGeneralNotificationReceived(
    GeneralNotificationReceived event,
    Emitter<NotificationState> emit,
  ) async {
    final currentState = state is NotificationFeedState
        ? state as NotificationFeedState
        : NotificationFeedState(items: const []);

    final item = NotificationItem(
      id: 'local_${DateTime.now().millisecondsSinceEpoch}',
      title: event.title,
      message: event.body,
      createdAt: DateTime.now(),
      isRead: false,
    );

    final newItems = [item, ...currentState.items];
    emit(
      currentState.copyWith(
        items: newItems,
        latestItem: item,
      ),
    );
    await _saveToStorage(newItems);
  }

  Future<void> _onClearAllNotifications(
    ClearAllNotifications event,
    Emitter<NotificationState> emit,
  ) async {
    emit(NotificationFeedState(items: const []));
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_storageKey);
    await repository.markAllAsRead();
  }

  Future<void> _onMarkAsRead(
    MarkAsRead event,
    Emitter<NotificationState> emit,
  ) async {
    if (state is! NotificationFeedState) return;
    final currentState = state as NotificationFeedState;

    final newItems = currentState.items.map((item) {
      if (item.id == event.notificationId) {
        return item.copyWith(isRead: true);
      }
      return item;
    }).toList();

    emit(currentState.copyWith(items: newItems));
    await _saveToStorage(newItems);

    // Call server to mark as read
    if (!event.notificationId.startsWith('local_')) {
      await repository.markAsRead(event.notificationId);
    }
  }

  Future<void> _saveToStorage(List<NotificationItem> items) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final String encoded = json.encode(items.map((e) => e.toJson()).toList());
      await prefs.setString(_storageKey, encoded);
    } catch (_) {}
  }
}
