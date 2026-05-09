import '../../domain/repositories/qr_scanner_repository.dart';
import '../datasources/qr_scanner_remote_data_source.dart';

class QRScannerRepositoryImpl implements QRScannerRepository {
  final QRScannerRemoteDataSource remoteDataSource;

  QRScannerRepositoryImpl({required this.remoteDataSource});

  @override
  Future<void> redeemCoupon(String code, String? storeId) async {
    return await remoteDataSource.redeemCoupon(code, storeId);
  }
}
