import 'dart:io';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';

abstract class UploadRemoteDataSource {
  Future<String> uploadImage(File file);
}

class UploadRemoteDataSourceImpl implements UploadRemoteDataSource {
  final ApiClient apiClient;

  UploadRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<String> uploadImage(File file) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: file.path.split('/').last,
        ),
      });

      final response = await apiClient.dio.post(
        '/upload',
        data: formData,
        options: Options(
          contentType: 'multipart/form-data',
        ),
      );

      return response.data['url'];
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'فشل رفع الصورة');
    }
  }
}
