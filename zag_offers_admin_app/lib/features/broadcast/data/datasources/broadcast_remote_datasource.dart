import 'package:zag_offers_admin_app/core/network/api_client.dart';

abstract class BroadcastRemoteDataSource {
  Future<void> sendBroadcast({
    required String title,
    required String body,
    String? imageUrl,
    String? area,
  });
}

class BroadcastRemoteDataSourceImpl implements BroadcastRemoteDataSource {
  final ApiClient client;

  BroadcastRemoteDataSourceImpl({required this.client});

  @override
  Future<void> sendBroadcast({
    required String title,
    required String body,
    String? imageUrl,
    String? area,
  }) async {
    await client.post(
      '/admin/broadcast',
      data: {'title': title, 'body': body, 'imageUrl': imageUrl, 'area': area},
    );
  }
}
