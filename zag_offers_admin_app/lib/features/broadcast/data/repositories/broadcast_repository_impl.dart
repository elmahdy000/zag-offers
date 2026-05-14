import 'package:dartz/dartz.dart';
import 'package:zag_offers_admin_app/core/error/failures.dart';
import 'package:zag_offers_admin_app/features/broadcast/domain/repositories/broadcast_repository.dart';
import 'package:zag_offers_admin_app/features/broadcast/data/datasources/broadcast_remote_datasource.dart';

class BroadcastRepositoryImpl implements BroadcastRepository {
  final BroadcastRemoteDataSource remoteDataSource;

  BroadcastRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<Failure, void>> sendBroadcast({
    required String title,
    required String body,
    String? imageUrl,
    String? area,
    String? target,
  }) async {
    try {
      await remoteDataSource.sendBroadcast(
        title: title,
        body: body,
        imageUrl: imageUrl,
        area: area,
        target: target,
      );
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
