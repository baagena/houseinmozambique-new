import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../core/network/api_config.dart';

class PaymentRepository {
  final ApiClient _client;
  PaymentRepository(this._client);

  /// Records a self-reported mobile-money/bank-transfer payment, mirroring the
  /// website's manual payment flow (src/app/api/payments/route.ts). Not under
  /// /api/mobile/v1 — it's the same shared route the website posts to.
  Future<void> submitManualPayment({
    required num amount,
    required String planType,
    required String userId,
    required String customerName,
    required String customerEmail,
    required String paymentReference,
  }) async {
    await _client.dio.post('${ApiConfig.rootUrl}/api/payments', data: {
      'amount': amount,
      'currency': 'MZN',
      'method': 'manual',
      'planType': planType,
      'userId': userId,
      'customerName': customerName,
      'customerEmail': customerEmail,
      'paymentReference': paymentReference,
    });
  }
}

final paymentRepositoryProvider = Provider<PaymentRepository>((ref) => PaymentRepository(ref.watch(apiClientProvider)));
