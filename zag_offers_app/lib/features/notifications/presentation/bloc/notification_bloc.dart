import 'dart:convert';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';

abstract class NotificationEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class LoadNotifications extends NotificationEvent {}

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

class NotificationItem extends Equatable {
  final String title;
  final String message;
  final DateTime createdAt;

  const NotificationItem({
    required this.title,
    required this.message,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
        'title': title,
        'message': message,
        'createdAt': createdAt.toIso8601String(),
      };

  factory NotificationItem.fromJson(Map<String, dynamic> json) => NotificationItem(
        title: json['title'],
        message: json['message'],
        createdAt: DateTime.parse(json['createdAt']),
      );

  @override
  List<Object?> get props => [title, message, createdAt];
}

abstract class NotificationState extends Equatable {
  @override
  List<Object?> get props => [];
}

class NotificationFeedState extends NotificationState {
  final List<NotificationItem> items;
  final NotificationItem? latestItem;

  NotificationFeedState({
    required this.items,
    this.latestItem,
  });

  NotificationFeedState copyWith({
    List<NotificationItem>? items,
    NotificationItem? latestItem,
    bool clearLatest = false,
  }) {
    return NotificationFeedState(
      items: items ?? this.items,
      latestItem: clearLatest ? null : (latestItem ?? this.latestItem),
    );
  }

  @override
  List<Object?> get props => [items, latestItem];
}

class NotificationBloc extends Bloc<NotificationEvent, NotificationState> {
  static const String _storageKey = 'notifications_history';

  NotificationBloc() : super(NotificationFeedState(items: const [])) {
    on<LoadNotifications>(_onLoadNotifications);
    on<NewSocialProofReceived>(_onNewSocialProofReceived);
    on<ClearLatestNotification>(_onClearLatestNotification);
    on<GeneralNotificationReceived>(_onGeneralNotificationReceived);
    on<ClearAllNotifications>(_onClearAllNotifications);
    
    // Load notifications on creation
    add(LoadNotifications());
  }

  Future<void> _onLoadNotifications(
    LoadNotifications event,
    Emitter<NotificationState> emit,
  ) async {
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

  Future<void> _onNewSocialProofReceived(
    NewSocialProofReceived event,
    Emitter<NotificationState> emit,
  ) async {
    final currentState = state is NotificationFeedState
        ? state as NotificationFeedState
        : NotificationFeedState(items: const []);

    final item = NotificationItem(
      title: 'تنبيه مباشر',
      message:
          'شخص ما حصل للتو على عرض "${event.offerTitle}" من ${event.storeName}',
      createdAt: DateTime.now(),
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
      title: event.title,
      message: event.body,
      createdAt: DateTime.now(),
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
  }

  Future<void> _saveToStorage(List<NotificationItem> items) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final String encoded = json.encode(items.map((e) => e.toJson()).toList());
      await prefs.setString(_storageKey, encoded);
    } catch (_) {}
  }
}
