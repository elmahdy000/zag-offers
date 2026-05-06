import 'dart:io';

import 'package:dio/dio.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/network/api_client.dart';

abstract class UploadRemoteDataSource {
  Future<String> uploadImage(File file);
}

class UploadRemoteDataSourceImpl implements UploadRemoteDataSource {
  final ApiClient apiClient;

  UploadRemoteDataSourceImpl({required this.apiClient});

  String _toAbsoluteUrl(String url) {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return '${AppConstants.socketUrl}$url';
  }

  @override
  Future<String> uploadImage(File file) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: file.path.split(Platform.pathSeparator).last,
        ),
      });

      final response = await apiClient.dio.post(
        '/upload',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );

      final rawUrl = (response.data['url'] ?? '').toString();
      if (rawUrl.isEmpty) {
        throw Exception('Failed to upload image');
      }
      return _toAbsoluteUrl(rawUrl);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to upload image');
    }
  }
}
