import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../models/coupon_model.dart';

abstract class CouponsRemoteDataSource {
  Future<CouponModel> generateCoupon(String offerId);
  Future<List<CouponModel>> getUserCoupons();
}

class CouponsRemoteDataSourceImpl implements CouponsRemoteDataSource {
  final ApiClient apiClient;

  CouponsRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<CouponModel> generateCoupon(String offerId) async {
    try {
      final response = await apiClient.dio.post('/coupons/generate', data: {
        'offerId': offerId,
      });
      return CouponModel.fromJson(response.data);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'فشل الحصول على الكوبون');
    }
  }

  @override
  Future<List<CouponModel>> getUserCoupons() async {
    try {
      final response = await apiClient.dio.get('/coupons/my');
      final raw = response.data;
      if (raw is List) {
        return raw.whereType<Map<String, dynamic>>()
            .map((json) => CouponModel.fromJson(json))
            .toList();
      }
      if (raw is Map && raw['items'] is List) {
        return (raw['items'] as List)
            .whereType<Map<String, dynamic>>()
            .map((json) => CouponModel.fromJson(json))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }
}

