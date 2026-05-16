import 'dart:async';
import 'dart:convert';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../domain/repositories/notifications_repository.dart';
import '../../domain/entities/notification_item_entity.dart';
import 'notification_event.dart';
import 'notification_state.dart';

export 'notification_event.dart';
export 'notification_state.dart';
export '../../domain/entities/notification_item_entity.dart';

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
          final items = decoded.map((e) => NotificationItemEntity.fromJson(e)).toList();
          emit(NotificationFeedState(items: items));
        }
      } catch (_) {}
    }

    // 2. Load from server if requested
    if (event.fromServer) {
      emit(_getCurrentState().copyWith(isLoading: true));
      
      final result = await repository.getNotifications();
      result.fold(
        (failure) => emit(_getCurrentState().copyWith(isLoading: false, error: failure.message)),
        (serverNotifications) async {
          final items = serverNotifications.map((n) => NotificationItemEntity(
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
    final currentState = _getCurrentState();

    final item = NotificationItemEntity(
      id: 'local_${DateTime.now().microsecondsSinceEpoch}',
      title: 'تنبيه مباشر',
      message: 'شخص ما حصل للتو على عرض "${event.offerTitle}" من ${event.storeName}',
      createdAt: DateTime.now(),
      isRead: false,
    );

    final newItems = [item, ...currentState.items];
    emit(currentState.copyWith(items: newItems, latestItem: item));
    await _saveToStorage(newItems);
  }

  void _onClearLatestNotification(
    ClearLatestNotification event,
    Emitter<NotificationState> emit,
  ) {
    emit(_getCurrentState().copyWith(clearLatest: true));
  }

  Future<void> _onGeneralNotificationReceived(
    GeneralNotificationReceived event,
    Emitter<NotificationState> emit,
  ) async {
    final currentState = _getCurrentState();

    final item = NotificationItemEntity(
      id: 'local_${DateTime.now().microsecondsSinceEpoch}',
      title: event.title,
      message: event.body,
      createdAt: DateTime.now(),
      isRead: false,
    );

    final newItems = [item, ...currentState.items];
    emit(currentState.copyWith(items: newItems, latestItem: item));
    await _saveToStorage(newItems);
  }

  Future<void> _onClearAllNotifications(
    ClearAllNotifications event,
    Emitter<NotificationState> emit,
  ) async {
    emit(NotificationFeedState(items: const []));
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_storageKey);
    await repository.clearAllNotifications();
  }

  Future<void> _onMarkAsRead(
    MarkAsRead event,
    Emitter<NotificationState> emit,
  ) async {
    final currentState = _getCurrentState();

    final newItems = currentState.items.map((item) {
      if (item.id == event.notificationId) {
        return item.copyWith(isRead: true);
      }
      return item;
    }).toList();

    emit(currentState.copyWith(items: newItems));
    await _saveToStorage(newItems);

    if (!event.notificationId.startsWith('local_')) {
      await repository.markAsRead(event.notificationId);
    }
  }

  NotificationFeedState _getCurrentState() {
    return state is NotificationFeedState ? (state as NotificationFeedState) : NotificationFeedState(items: const []);
  }

  Future<void> _saveToStorage(List<NotificationItemEntity> items) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final String encoded = json.encode(items.map((e) => e.toJson()).toList());
      await prefs.setString(_storageKey, encoded);
    } catch (_) {}
  }
}
