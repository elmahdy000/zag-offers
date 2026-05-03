import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';

abstract class QRScannerRemoteDataSource {
  Future<void> redeemCoupon(String code);
}

class QRScannerRemoteDataSourceImpl implements QRScannerRemoteDataSource {
  final ApiClient apiClient;

  QRScannerRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<void> redeemCoupon(String code) async {
    try {
      await apiClient.dio.post(
        '/coupons/redeem',
        data: {'code': code},
      );
    } on DioException catch (e) {
      final message = e.response?.data['message'] ?? e.message;
      throw Exception(message);
    }
  }
}
