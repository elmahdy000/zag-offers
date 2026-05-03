import '../../../../core/usecases/usecase.dart';
import '../repositories/qr_scanner_repository.dart';

class RedeemCouponUseCase implements UseCase<void, String> {
  final QRScannerRepository repository;

  RedeemCouponUseCase(this.repository);

  @override
  Future<void> call(String code) async {
    return await repository.redeemCoupon(code);
  }
}
