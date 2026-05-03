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
      return (response.data as List)
          .map<CouponModel>((json) => CouponModel.fromJson(json))
          .toList();
    } on DioException catch (e) {
      throw Exception(e.message);
    }
  }
}

