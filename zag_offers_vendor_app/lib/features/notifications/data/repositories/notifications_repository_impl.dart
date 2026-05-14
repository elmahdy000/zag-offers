import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/dio_error_mapper.dart';
import 'package:zag_offers_vendor_app/features/notifications/domain/entities/notification_entity.dart';
import 'package:zag_offers_vendor_app/features/notifications/domain/repositories/notifications_repository.dart';

class NotificationsRepositoryImpl implements NotificationsRepository {
  final ApiClient apiClient;

  NotificationsRepositoryImpl({required this.apiClient});

  @override
  Future<Either<Failure, List<NotificationEntity>>> getNotifications() async {
    try {
      final response = await apiClient.get('/notifications');
      final List<dynamic> data = response.data;
      
      final notifications = data.map((json) => NotificationEntity(
        id: json['id'],
        title: json['title'],
        body: json['body'],
        imageUrl: json['imageUrl'],
        type: json['type'],
        data: json['data'],
        isRead: json['isRead'] ?? false,
        createdAt: DateTime.parse(json['createdAt']),
      )).toList();
      
      return Right(notifications);
    } on DioException catch (e) {
      return Left(ServerFailure(mapDioErrorToMessage(e)));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> markAsRead(String id) async {
    try {
      await apiClient.post('/notifications/$id/read');
      return const Right(null);
    } on DioException catch (e) {
      return Left(ServerFailure(mapDioErrorToMessage(e)));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> markAllAsRead() async {
    try {
      await apiClient.post('/notifications/read-all');
      return const Right(null);
    } on DioException catch (e) {
      return Left(ServerFailure(mapDioErrorToMessage(e)));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
