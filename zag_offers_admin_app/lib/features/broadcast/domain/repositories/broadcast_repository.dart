import 'package:dartz/dartz.dart';
import 'package:zag_offers_admin_app/core/error/failures.dart';

abstract class BroadcastRepository {
  Future<Either<Failure, void>> sendBroadcast({
    required String title,
    required String body,
    String? imageUrl,
    String? area,
    String? target,
  });
}
