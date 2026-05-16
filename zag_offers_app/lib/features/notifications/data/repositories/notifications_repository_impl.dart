import 'dart:convert';
import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/notification_item_entity.dart';
import '../../domain/repositories/notifications_repository.dart';

class NotificationsRepositoryImpl implements NotificationsRepository {
  final ApiClient apiClient;

  NotificationsRepositoryImpl({required this.apiClient});

  @override
  Future<Either<Failure, List<NotificationItemEntity>>> getNotifications() async {
    try {
      final response = await apiClient.dio.get('/notifications');
      final List<dynamic> data = response.data;
      
      final notifications = data.map((json) {
        Map<String, dynamic>? extraData;
        if (json['data'] != null && json['data'] is String) {
          try {
            extraData = jsonDecode(json['data']);
          } catch (_) {}
        }

        return NotificationItemEntity(
          id: json['id'],
          title: json['title'],
          message: json['body'],
          createdAt: DateTime.parse(json['createdAt']),
          isRead: json['isRead'] ?? false,
          type: json['type'],
          imageUrl: json['imageUrl'],
          data: extraData,
        );
      }).toList();
      
      return Right(notifications);
    } on DioException catch (e) {
      return Left(ServerFailure(e.message ?? 'فشل جلب الإشعارات'));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> markAllAsRead() async {
    try {
      await apiClient.dio.post('/notifications/read-all');
      return const Right(null);
    } on DioException catch (e) {
      return Left(ServerFailure(e.message ?? 'فشل تحديث الإشعارات'));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> markAsRead(String notificationId) async {
    try {
      await apiClient.dio.post('/notifications/$notificationId/read');
      return const Right(null);
    } on DioException catch (e) {
      return Left(ServerFailure(e.message ?? 'فشل تحديث الإشعار'));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> clearAllNotifications() async {
    try {
      await apiClient.dio.delete('/notifications/clear-all');
      return const Right(null);
    } on DioException catch (e) {
      return Left(ServerFailure(e.message ?? 'فشل حذف الإشعارات'));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
