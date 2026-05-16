import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/notification_item_entity.dart';

abstract class NotificationsRepository {
  Future<Either<Failure, List<NotificationItemEntity>>> getNotifications();
  Future<Either<Failure, void>> markAllAsRead();
  Future<Either<Failure, void>> markAsRead(String notificationId);
  Future<Either<Failure, void>> clearAllNotifications();
}
