import 'package:zag_offers_admin_app/core/network/api_client.dart';
import 'package:zag_offers_admin_app/features/users/data/models/user_details_model.dart';
import 'package:zag_offers_admin_app/features/users/data/models/user_model.dart';

abstract class UserRemoteDataSource {
  Future<({List<UserModel> items, int total})> getUsers({String? search});
  Future<UserDetailsModel> getUserDetails(String id);
  Future<void> deleteUser(String id);
  Future<void> updateUser(String id, {int? points, String? role});
  Future<void> updateUserRole(String id, String role);
}

class UserRemoteDataSourceImpl implements UserRemoteDataSource {
  final ApiClient client;

  UserRemoteDataSourceImpl({required this.client});

  @override
  Future<({List<UserModel> items, int total})> getUsers({String? search}) async {
    final response = await client.get(
      '/admin/users',
      queryParameters: {if (search != null) 'search': search},
    );

    final data = response.data;
    final List list = (data is Map && data['items'] is List)
        ? data['items']
        : (data is List ? data : []);

    final int total = (data is Map && data['meta'] != null && data['meta']['total'] != null)
        ? (data['meta']['total'] as num).toInt()
        : list.length;

    return (
      items: list.map((e) => UserModel.fromJson(Map<String, dynamic>.from(e))).toList(),
      total: total,
    );
  }

  @override
  Future<UserDetailsModel> getUserDetails(String id) async {
    final response = await client.get('/admin/users/$id');
    return UserDetailsModel.fromJson(Map<String, dynamic>.from(response.data));
  }

  @override
  Future<void> deleteUser(String id) async {
    await client.delete('/admin/users/$id');
  }

  @override
  Future<void> updateUser(String id, {int? points, String? role}) async {
    await client.patch(
      '/admin/users/$id',
      data: {
        if (points != null) 'points': points,
        if (role != null) 'role': role,
      },
    );
  }

  @override
  Future<void> updateUserRole(String id, String role) async {
    await client.patch('/admin/users/$id/role', data: {'role': role});
  }
}
