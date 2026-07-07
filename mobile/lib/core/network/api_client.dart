import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/token_storage.dart';
import 'api_config.dart';
import 'isrg_root_x1.dart';

const _networkErrorTypes = {
  DioExceptionType.connectionError,
  DioExceptionType.connectionTimeout,
  DioExceptionType.sendTimeout,
  DioExceptionType.receiveTimeout,
};

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final bool isNetworkError;
  ApiException(this.message, {this.statusCode, this.isNetworkError = false});
  @override
  String toString() => message;
}

/// Dio always throws [DioException] from request calls, never the [ApiException]
/// nested inside it by [ApiClient]'s error interceptor — so `e is ApiException`
/// is never true at call sites. Use `e.asApiException` to unwrap it correctly.
extension ApiExceptionUnwrap on Object? {
  ApiException? get asApiException {
    final e = this;
    if (e is ApiException) return e;
    if (e is DioException && e.error is ApiException) return e.error as ApiException;
    return null;
  }
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

    if (!kIsWeb) {
      dio.httpClientAdapter = IOHttpClientAdapter(
        createHttpClient: () {
          final context = SecurityContext(withTrustedRoots: true);
          context.setTrustedCertificatesBytes(utf8.encode(isrgRootX1Pem));
          return HttpClient(context: context);
        },
      );
    }

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await TokenStorage.readToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) {
        final isNetworkError = _networkErrorTypes.contains(error.type);
        final data = error.response?.data;
        final message = isNetworkError
            ? 'common.noInternet'.tr()
            : (data is Map && data['error'] != null)
                ? data['error'].toString()
                : error.message ?? 'common.somethingWentWrong'.tr();
        handler.next(DioException(
          requestOptions: error.requestOptions,
          error: ApiException(message, statusCode: error.response?.statusCode, isNetworkError: isNetworkError),
          response: error.response,
          type: error.type,
        ));
      },
    ));
  }
}

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());
