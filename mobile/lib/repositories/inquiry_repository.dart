import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../core/network/api_config.dart';

class InquiryRepository {
  final ApiClient _client;
  InquiryRepository(this._client);

  Future<void> submit({
    required String name,
    required String email,
    required String subject,
    required String message,
    String? propertyId,
    String? agentId,
  }) async {
    // Not under /api/mobile/v1 — it's the same public JSON route the website
    // already posts to, so we hit the site root directly.
    await _client.dio.post('${ApiConfig.rootUrl}/api/inquiries', data: {
      'name': name,
      'email': email,
      'subject': subject,
      'message': message,
      if (propertyId != null) 'propertyId': propertyId,
      if (agentId != null) 'agentId': agentId,
    });
  }
}

final inquiryRepositoryProvider =
    Provider<InquiryRepository>((ref) => InquiryRepository(ref.watch(apiClientProvider)));
