import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:zag_offers_vendor_app/features/notifications/domain/entities/notification_entity.dart';
import 'package:zag_offers_vendor_app/features/notifications/domain/repositories/notifications_repository.dart';

// --- Events ---
abstract class NotificationsEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class GetNotificationsRequested extends NotificationsEvent {}

class MarkNotificationAsReadRequested extends NotificationsEvent {
  final String id;
  MarkNotificationAsReadRequested(this.id);
  @override
  List<Object?> get props => [id];
}

class MarkAllAsReadRequested extends NotificationsEvent {}

// --- States ---
abstract class NotificationsState extends Equatable {
  @override
  List<Object?> get props => [];
}

class NotificationsInitial extends NotificationsState {}

class NotificationsLoading extends NotificationsState {}

class NotificationsLoaded extends NotificationsState {
  final List<NotificationEntity> notifications;
  NotificationsLoaded(this.notifications);
  @override
  List<Object?> get props => [notifications];
}

class NotificationsError extends NotificationsState {
  final String message;
  NotificationsError(this.message);
  @override
  List<Object?> get props => [message];
}

// --- BLoC ---
class NotificationsBloc extends Bloc<NotificationsEvent, NotificationsState> {
  final NotificationsRepository repository;

  NotificationsBloc({required this.repository}) : super(NotificationsInitial()) {
    on<GetNotificationsRequested>(_onGetNotificationsRequested);
    on<MarkNotificationAsReadRequested>(_onMarkNotificationAsReadRequested);
    on<MarkAllAsReadRequested>(_onMarkAllAsReadRequested);
  }

  Future<void> _onGetNotificationsRequested(
    GetNotificationsRequested event,
    Emitter<NotificationsState> emit,
  ) async {
    emit(NotificationsLoading());
    final result = await repository.getNotifications();
    result.fold(
      (failure) => emit(NotificationsError(failure.message)),
      (notifications) => emit(NotificationsLoaded(notifications)),
    );
  }

  Future<void> _onMarkNotificationAsReadRequested(
    MarkNotificationAsReadRequested event,
    Emitter<NotificationsState> emit,
  ) async {
    final result = await repository.markAsRead(event.id);
    result.fold(
      (failure) => null, // Silently fail or log
      (_) {
        if (state is NotificationsLoaded) {
          final currentNotifications = (state as NotificationsLoaded).notifications;
          final updatedNotifications = currentNotifications.map((n) {
            if (n.id == event.id) {
              return NotificationEntity(
                id: n.id,
                title: n.title,
                body: n.body,
                imageUrl: n.imageUrl,
                type: n.type,
                data: n.data,
                isRead: true,
                createdAt: n.createdAt,
              );
            }
            return n;
          }).toList();
          emit(NotificationsLoaded(updatedNotifications));
        }
      },
    );
  }

  Future<void> _onMarkAllAsReadRequested(
    MarkAllAsReadRequested event,
    Emitter<NotificationsState> emit,
  ) async {
    final result = await repository.markAllAsRead();
    result.fold(
      (failure) => null,
      (_) {
        if (state is NotificationsLoaded) {
          final currentNotifications = (state as NotificationsLoaded).notifications;
          final updatedNotifications = currentNotifications.map((n) {
            return NotificationEntity(
              id: n.id,
              title: n.title,
              body: n.body,
              imageUrl: n.imageUrl,
              type: n.type,
              data: n.data,
              isRead: true,
              createdAt: n.createdAt,
            );
          }).toList();
          emit(NotificationsLoaded(updatedNotifications));
        }
      },
    );
  }
}
