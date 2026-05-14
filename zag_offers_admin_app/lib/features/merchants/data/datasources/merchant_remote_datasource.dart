import 'package:zag_offers_admin_app/core/network/api_client.dart';
import 'package:zag_offers_admin_app/features/merchants/data/models/merchant_model.dart';

abstract class MerchantRemoteDataSource {
  Future<({List<MerchantModel> items, int total})> getMerchants({String? status});
  Future<MerchantModel> getMerchantDetails(String id);
  Future<void> updateMerchantStatus(String id, String status, {String? reason});
  Future<void> deleteMerchant(String id);
  Future<void> createMerchant({
    required String ownerName,
    required String phone,
    String? email,
    required String password,
    required String storeName,
    required String categoryId,
    String? area,
    String? address,
  });
}

class MerchantRemoteDataSourceImpl implements MerchantRemoteDataSource {
  final ApiClient client;

  MerchantRemoteDataSourceImpl({required this.client});

  @override
  Future<({List<MerchantModel> items, int total})> getMerchants({String? status}) async {
    final response = await client.get(
      '/admin/stores',
      queryParameters: status != null ? {'status': status} : null,
    );

    final List itemsList = response.data is Map
        ? (response.data['items'] ?? [])
        : (response.data is List ? List.from(response.data as List) : []);

    final int total = response.data is Map && response.data['meta'] != null
        ? (response.data['meta']['total'] ?? itemsList.length)
        : itemsList.length;

    final merchants = itemsList.map((e) => MerchantModel.fromJson(e)).toList();
    return (items: merchants, total: total);
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

  @override
  Future<void> createMerchant({
    required String ownerName,
    required String phone,
    String? email,
    required String password,
    required String storeName,
    required String categoryId,
    String? area,
    String? address,
  }) async {
    // 1. Create the User (Merchant)
    final userResponse = await client.post('/admin/users', data: {
      'name': ownerName,
      'phone': phone,
      'email': email,
      'password': password,
      'role': 'MERCHANT',
    });

    final String userId = userResponse.data['id'];

    // 2. Create the Store for this User
    await client.post('/admin/stores', data: {
      'name': storeName,
      'categoryId': categoryId,
      'ownerId': userId,
      'address': address ?? '',
      'area': area ?? '',
      'phone': phone, // Use same phone for store
      'status': 'APPROVED',
    });
  }
}
