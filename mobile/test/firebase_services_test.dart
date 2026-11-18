// Until lib/core/firebase/firebase_options.dart is generated from the
// Firebase console files, push notifications and analytics must be inert:
// nothing may throw, prompt, or call the network. These tests pin that, so a
// build made before Firebase is set up behaves exactly like the app did
// without it.

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:mobile/core/firebase/firebase_options.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/models/agent.dart';
import 'package:mobile/services/firebase_services.dart';

class _NoNetworkClient extends ApiClient {
  int calls = 0;
  _NoNetworkClient() {
    dio.interceptors.insert(0, _BlockingInterceptor(() => calls++));
  }
}

/// Counts any request that would leave the phone.
class _BlockingInterceptor extends Interceptor {
  final void Function() onCall;
  _BlockingInterceptor(this.onCall);
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    onCall();
    handler.reject(DioException(requestOptions: options, error: 'blocked in test'));
  }
}

final _agent = Agent(id: 'a1', name: 'Ana', initials: 'A', title: 'Agent', location: 'Maputo', role: 'AGENT');

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});

  test('settings point at the House in Mozambique project for both apps', () {
    final android = DefaultFirebaseOptions.android!;
    final ios = DefaultFirebaseOptions.ios!;
    expect(android.projectId, 'house-in-mozambique');
    expect(ios.projectId, 'house-in-mozambique');
    expect(android.appId, contains(':android:'));
    expect(ios.appId, contains(':ios:'));
    expect(ios.iosBundleId, 'com.houseinmozambique.mobile');
  });

  test('if Firebase cannot start, the app still starts (no throw, stays off)', () async {
    // No native Firebase in unit tests: initialisation fails and must be swallowed.
    await initFirebase();
    expect(firebaseReady, isFalse);
  });

  test('analytics calls are harmless no-ops', () {
    Analytics.screen('/home');
    Analytics.event('anything', {'a': 1});
    Analytics.setAccount(_agent);
    Analytics.setAccount(null);
    Analytics.setLanguage('pt');
    Analytics.login();
    Analytics.signUp('AGENT');
    Analytics.viewProperty('p1', 'Villa', 'Maputo');
    Analytics.contactAgent('whatsapp');
    Analytics.search('');
    Analytics.favorite(true);
    Analytics.listingSubmitted();
  });

  test('push never registers, prompts or calls the server without Firebase', () async {
    final client = _NoNetworkClient();
    final push = PushService(client);
    await push.startListening((_) => fail('nothing to open'));
    await push.syncFor(_agent, lang: 'pt', appVersion: '1.3.0');
    await push.setEnabled(true, _agent, lang: 'pt', appVersion: '1.3.0');
    await push.unregister();
    expect(client.calls, 0);
  });

  test('the notifications switch is remembered and defaults to on', () async {
    SharedPreferences.setMockInitialValues({});
    expect(await pushEnabledPreference(), isTrue);
    await PushService(_NoNetworkClient()).setEnabled(false, _agent, lang: 'en', appVersion: '');
    expect(await pushEnabledPreference(), isFalse);
  });
}
