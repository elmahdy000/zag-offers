import 'package:zag_offers_admin_app/core/network/api_client.dart';
import 'package:zag_offers_admin_app/features/coupons/data/models/coupon_model.dart';

abstract class CouponRemoteDataSource {
  Future<List<CouponModel>> getCoupons({
    String? search,
    String? status,
    int page = 1,
  });
  Future<void> deleteCoupon(String id);
}

class CouponRemoteDataSourceImpl implements CouponRemoteDataSource {
  final ApiClient client;

  CouponRemoteDataSourceImpl({required this.client});

  @override
  Future<List<CouponModel>> getCoupons({
    String? search,
    String? status,
    int page = 1,
  }) async {
    final response = await client.get(
      '/admin/coupons',
      queryParameters: {
        if (search != null) 'search': search,
        if (status != null) 'status': status,
        'page': page,
        'limit': 20,
      },
    );

    final List items = response.data['items'] ?? [];
    return items.map((json) => CouponModel.fromJson(json)).toList();
  }

  @override
  Future<void> deleteCoupon(String id) async {
    await client.delete('/admin/coupons/$id');
  }
}
