import 'package:zag_offers_admin_app/core/network/api_client.dart';
import 'package:zag_offers_admin_app/features/offers/data/models/offer_model.dart';

abstract class OfferRemoteDataSource {
  Future<List<OfferModel>> getOffers({String? status, String? merchantId});
  Future<void> updateOfferStatus(String id, String status, {String? reason});
  Future<void> deleteOffer(String id);
  Future<void> createOffer(Map<String, dynamic> offerData);
  Future<void> updateOffer(String id, Map<String, dynamic> offerData);
}

class OfferRemoteDataSourceImpl implements OfferRemoteDataSource {
  final ApiClient client;

  OfferRemoteDataSourceImpl({required this.client});

  @override
  Future<List<OfferModel>> getOffers({String? status, String? merchantId}) async {
    final queryParams = <String, dynamic>{};
    if (status != null) queryParams['status'] = status;
    if (merchantId != null) queryParams['storeId'] = merchantId;

    final response = await client.get(
      '/admin/offers',
      queryParameters: queryParams.isNotEmpty ? queryParams : null,
    );

    final List items = response.data is Map
        ? (response.data['items'] ?? [])
        : (response.data is List ? List.from(response.data as List) : []);

    return items.map((e) => OfferModel.fromJson(e)).toList();
  }

  @override
  Future<void> updateOfferStatus(
    String id,
    String status, {
    String? reason,
  }) async {
    final path = switch (status) {
      'APPROVED' => '/admin/offers/$id/approve',
      'REJECTED' => '/admin/offers/$id/reject',
      _ => '/admin/offers/$id',
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
  Future<void> deleteOffer(String id) async {
    await client.delete('/admin/offers/$id');
  }

  @override
  Future<void> createOffer(Map<String, dynamic> offerData) async {
    await client.post('/admin/offers', data: offerData);
  }

  @override
  Future<void> updateOffer(String id, Map<String, dynamic> offerData) async {
    await client.put('/admin/offers/$id', data: offerData);
  }
}
