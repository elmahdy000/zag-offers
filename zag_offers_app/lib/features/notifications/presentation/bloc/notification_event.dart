import 'package:equatable/equatable.dart';

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
