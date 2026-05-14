import 'dart:io';
import 'package:dio/dio.dart';
import 'package:zag_offers_admin_app/core/network/api_client.dart';
import 'package:zag_offers_admin_app/core/config/app_config.dart';

abstract class UploadRemoteDataSource {
  Future<String> uploadImage(File file);
}

class UploadRemoteDataSourceImpl implements UploadRemoteDataSource {
  final ApiClient client;

  UploadRemoteDataSourceImpl({required this.client});

  @override
  Future<String> uploadImage(File file) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        file.path,
        filename: file.path.split(Platform.pathSeparator).last,
      ),
    });

    final response = await client.upload('/upload', formData);
    final url = response.data['url'];
    
    if (url == null) throw Exception('Failed to upload image');
    
    // Resolve relative URL
    if (url.toString().startsWith('http')) return url.toString();
    return '${AppConfig.socketUrl}$url';
  }
}
