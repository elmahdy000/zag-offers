import '../../../../core/usecases/usecase.dart';
import '../repositories/qr_scanner_repository.dart';

class RedeemCouponUseCase implements UseCase<void, Map<String, dynamic>> {
  final QRScannerRepository repository;

  RedeemCouponUseCase(this.repository);

  @override
  Future<void> call(Map<String, dynamic> params) async {
    final code = params['code'] as String;
    final storeId = params['storeId'] as String?;
    return await repository.redeemCoupon(code, storeId);
  }
}
