import 'package:dio/dio.dart';
import '../../../../core/error/exceptions.dart';
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
      
      if (response.data == null) {
        throw ServerException('السيرفر لم يرجع أي بيانات');
      }
      
      return CouponModel.fromJson(response.data);
    } on DioException catch (e) {
      final message = e.response?.data is Map 
          ? (e.response?.data['message'] ?? 'فشل الحصول على الكوبون')
          : 'فشل الحصول على الكوبون';
      throw ServerException(message);
    } catch (e) {
      throw ServerException('حدث خطأ غير متوقع أثناء توليد الكوبون');
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
      final message = e.response?.data is Map 
          ? (e.response?.data['message'] ?? 'فشل تحميل الكوبونات')
          : 'فشل تحميل الكوبونات';
      throw ServerException(message);
    } catch (e) {
      throw ServerException('حدث خطأ غير متوقع أثناء تحميل الكوبونات');
    }
  }
}
