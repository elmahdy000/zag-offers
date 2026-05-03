import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

abstract class NotificationEvent extends Equatable {
  @override
  List<Object?> get props => [];
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
  NotificationBloc() : super(NotificationFeedState(items: const [])) {
    on<NewSocialProofReceived>(_onNewSocialProofReceived);
    on<ClearLatestNotification>(_onClearLatestNotification);
    on<GeneralNotificationReceived>(_onGeneralNotificationReceived);
  }

  void _onNewSocialProofReceived(
    NewSocialProofReceived event,
    Emitter<NotificationState> emit,
  ) {
    final currentState = state is NotificationFeedState
        ? state as NotificationFeedState
        : NotificationFeedState(items: const []);

    final item = NotificationItem(
      title: 'تنبيه مباشر',
      message:
          'شخص ما حصل للتو على عرض "${event.offerTitle}" من ${event.storeName}',
      createdAt: DateTime.now(),
    );

    emit(
      currentState.copyWith(
        items: [item, ...currentState.items],
        latestItem: item,
      ),
    );
  }

  void _onClearLatestNotification(
    ClearLatestNotification event,
    Emitter<NotificationState> emit,
  ) {
    if (state is! NotificationFeedState) return;
    emit((state as NotificationFeedState).copyWith(clearLatest: true));
  }

  void _onGeneralNotificationReceived(
    GeneralNotificationReceived event,
    Emitter<NotificationState> emit,
  ) {
    final currentState = state is NotificationFeedState
        ? state as NotificationFeedState
        : NotificationFeedState(items: const []);

    final item = NotificationItem(
      title: event.title,
      message: event.body,
      createdAt: DateTime.now(),
    );

    emit(
      currentState.copyWith(
        items: [item, ...currentState.items],
        latestItem: item,
      ),
    );
  }
}
