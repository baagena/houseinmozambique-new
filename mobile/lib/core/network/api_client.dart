import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/token_storage.dart';
import 'api_config.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  ApiException(this.message, {this.statusCode});
  @override
  String toString() => message;
}

class ApiClient {
  late final Dio dio;

  ApiClient() {
    dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await TokenStorage.readToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) {
        final data = error.response?.data;
        final message = (data is Map && data['error'] != null)
            ? data['error'].toString()
            : error.message ?? 'Something went wrong. Please try again.';
        handler.next(DioException(
          requestOptions: error.requestOptions,
          error: ApiException(message, statusCode: error.response?.statusCode),
          response: error.response,
          type: error.type,
        ));
      },
    ));
  }
}

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());
