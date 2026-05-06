import 'package:zag_offers_admin_app/core/network/api_client.dart';
import 'package:zag_offers_admin_app/features/merchants/data/models/merchant_model.dart';

abstract class MerchantRemoteDataSource {
  Future<List<MerchantModel>> getMerchants({String? status});
  Future<MerchantModel> getMerchantDetails(String id);
  Future<void> updateMerchantStatus(String id, String status, {String? reason});
  Future<void> deleteMerchant(String id);
}

class MerchantRemoteDataSourceImpl implements MerchantRemoteDataSource {
  final ApiClient client;

  MerchantRemoteDataSourceImpl({required this.client});

  @override
  Future<List<MerchantModel>> getMerchants({String? status}) async {
    final response = await client.get(
      '/admin/stores',
      queryParameters: status != null ? {'status': status} : null,
    );

    final List items = response.data is Map
        ? (response.data['items'] ?? [])
        : (response.data is List ? List.from(response.data as List) : []);

    return items.map((e) => MerchantModel.fromJson(e)).toList();
  }

  @override
  Future<MerchantModel> getMerchantDetails(String id) async {
    final response = await client.get('/admin/stores/$id');
    return MerchantModel.fromJson(response.data);
  }

  @override
  Future<void> updateMerchantStatus(
    String id,
    String status, {
    String? reason,
  }) async {
    final path = switch (status) {
      'APPROVED' => '/admin/stores/$id/approve',
      'REJECTED' => '/admin/stores/$id/reject',
      'SUSPENDED' => '/admin/stores/$id/suspend',
      _ => '/admin/stores/$id',
    };

    await client.patch(
      path,
      data: {
        if (path.endsWith('/$id')) 'status': status,
        if (reason != null && reason.trim().isNotEmpty)
          'reason': reason.trim(),
      },
    );
  }

  @override
  Future<void> deleteMerchant(String id) async {
    await client.delete('/admin/stores/$id');
  }
}
