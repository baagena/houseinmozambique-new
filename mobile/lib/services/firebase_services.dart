// Firebase is pinned to the previous majors (firebase_core 4, messaging 16,
// analytics 12). The newest (5 / 17 / 13) ship Android libraries built with
// Kotlin 2.4, which this project's Kotlin 2.1 Gradle plugin cannot read — the
// release build fails. Upgrade Kotlin (android/settings.gradle.kts) first.
// messaging 17 also deprecates getToken()/onTokenRefresh() for an
// installation-ID API; keep the token API while the server sends with
// firebase-admin, whose messaging API only targets registration tokens.

import 'dart:async';
import 'dart:io' show Platform;

import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/firebase/firebase_options.dart';
import '../core/network/api_client.dart';
import '../models/agent.dart';

/// Push notifications (Firebase Cloud Messaging) and usage analytics (Google
/// Analytics for Firebase).
///
/// Everything here is a no-op until lib/core/firebase/firebase_options.dart has
/// this platform's settings, and every call swallows its own errors: a
/// notification or analytics failure must never break a screen.

/// The version shown in the stores, passed by `flutter build` (empty in debug).
const appVersion = String.fromEnvironment('FLUTTER_BUILD_NAME');

bool _firebaseReady = false;
bool get firebaseReady => _firebaseReady;

/// Called once from main() before runApp. Never throws, never hangs startup.
Future<void> initFirebase() async {
  final options = DefaultFirebaseOptions.currentPlatform;
  if (options == null) return;
  try {
    await Firebase.initializeApp(options: options).timeout(const Duration(seconds: 8));
    _firebaseReady = true;
  } catch (e) {
    debugPrint('Firebase init failed: $e');
  }
}

// ── Analytics ────────────────────────────────────────────────────────────────

/// Thin wrapper so call sites don't need to know whether Firebase is on.
class Analytics {
  Analytics._();

  static FirebaseAnalytics? get _ga => _firebaseReady ? FirebaseAnalytics.instance : null;
  static String? _lastScreen;

  static void _run(Future<void> Function(FirebaseAnalytics ga) f) {
    final ga = _ga;
    if (ga == null) return;
    unawaited(f(ga).catchError((Object e) => debugPrint('analytics: $e')));
  }

  /// A screen, named by its route pattern ("/property/:id") — never the ids.
  static void screen(String name) {
    if (name.isEmpty || name == _lastScreen) return;
    _lastScreen = name;
    _run((ga) => ga.logScreenView(screenName: name, screenClass: name));
  }

  static void event(String name, [Map<String, Object>? params]) =>
      _run((ga) => ga.logEvent(name: name, parameters: params));

  /// Who is using the app, as a role — counted, never named. The account id is
  /// an opaque database key, which Google Analytics allows; no name, email or
  /// phone is ever sent.
  static void setAccount(Agent? agent) => _run((ga) async {
        await ga.setUserId(id: agent?.id);
        await ga.setUserProperty(
          name: 'account_type',
          value: agent == null ? 'guest' : agent.role.toLowerCase(),
        );
      });

  static void setLanguage(String lang) => _run((ga) => ga.setUserProperty(name: 'app_language', value: lang));

  static void login() => _run((ga) => ga.logLogin(loginMethod: 'email'));
  static void signUp(String role) => _run((ga) => ga.logSignUp(signUpMethod: role.toLowerCase()));
  static String? _lastViewed;

  /// Called from the detail screen's build, so repeated builds of the same
  /// listing count once.
  static void viewProperty(String id, String type, String city) {
    if (id == _lastViewed) return;
    _lastViewed = id;
    event('view_item', {'item_id': id, 'item_category': type, 'item_category2': city});
  }

  static void contactAgent(String channel) => event('generate_lead', {'method': channel});

  /// The filters searched on (type, city, property kinds) — no free text.
  static void search(String term) {
    final t = term.trim().isEmpty ? 'all' : term.trim();
    event('search', {'search_term': t.length > 90 ? t.substring(0, 90) : t});
  }
  static void favorite(bool added) => event(added ? 'add_to_wishlist' : 'remove_from_wishlist');
  static void listingSubmitted() => event('listing_submitted');
}

// ── Push notifications ───────────────────────────────────────────────────────

const _pushPrefKey = 'push_enabled';

/// Whether this phone should receive notifications (the switch on the profile
/// tab). On by default for agents and admins.
Future<bool> pushEnabledPreference() async {
  try {
    return (await SharedPreferences.getInstance()).getBool(_pushPrefKey) ?? true;
  } catch (_) {
    return true;
  }
}

/// Snack bars for notifications that arrive while the app is open (Android
/// does not show those itself). Set on MaterialApp.router.
final pushMessengerKey = GlobalKey<ScaffoldMessengerState>();

class PushService {
  final ApiClient _client;
  PushService(this._client);

  String? _registeredToken;
  StreamSubscription<String>? _refreshSub;
  bool _listening = false;

  static bool get _isIos => !kIsWeb && Platform.isIOS;

  /// Wires notification taps and foreground messages. [openRoute] navigates.
  Future<void> startListening(void Function(String route) openRoute) async {
    if (!_firebaseReady || _listening) return;
    _listening = true;
    try {
      final fcm = FirebaseMessaging.instance;
      // iOS shows the banner itself while the app is open; Android does not.
      await fcm.setForegroundNotificationPresentationOptions(alert: true, badge: true, sound: true);

      void open(RemoteMessage m) {
        final route = m.data['route'];
        if (route is String && route.startsWith('/')) openRoute(route);
      }

      FirebaseMessaging.onMessageOpenedApp.listen(open);
      final initial = await fcm.getInitialMessage();
      if (initial != null) {
        // Let the first frame and the auth restore settle before navigating.
        Future<void>.delayed(const Duration(milliseconds: 1200), () => open(initial));
      }

      FirebaseMessaging.onMessage.listen((m) {
        if (_isIos) return;
        final n = m.notification;
        if (n == null) return;
        pushMessengerKey.currentState?.showSnackBar(SnackBar(
          content: Text([n.title, n.body].whereType<String>().join('\n')),
          duration: const Duration(seconds: 6),
          action: m.data['route'] is String
              ? SnackBarAction(label: '›', onPressed: () => open(m))
              : null,
        ));
      });
    } catch (e) {
      debugPrint('push listen failed: $e');
    }
  }

  /// Registers this phone for the signed-in agent/admin, or does nothing for
  /// guests and customers. Asks the OS for permission the first time.
  Future<void> syncFor(Agent? agent, {required String lang, required String appVersion}) async {
    if (!_firebaseReady || agent == null || !agent.isAgent) return;
    if (!await pushEnabledPreference()) return;
    try {
      final fcm = FirebaseMessaging.instance;
      final settings = await fcm.requestPermission(alert: true, badge: true, sound: true);
      if (settings.authorizationStatus == AuthorizationStatus.denied) return;

      if (_isIos) {
        // The FCM token needs the APNs token, which can take a moment.
        for (var i = 0; i < 5 && await fcm.getAPNSToken() == null; i++) {
          await Future<void>.delayed(const Duration(seconds: 1));
        }
      }
      final token = await fcm.getToken();
      if (token == null) return;
      await _register(token, lang: lang, appVersion: appVersion);

      await _refreshSub?.cancel();
      _refreshSub = fcm.onTokenRefresh.listen(
        (t) => _register(t, lang: lang, appVersion: appVersion).catchError((Object _) {}),
      );
    } catch (e) {
      debugPrint('push sync failed: $e');
    }
  }

  Future<void> _register(String token, {required String lang, required String appVersion}) async {
    await _client.dio.post('/devices', data: {
      'token': token,
      'platform': _isIos ? 'ios' : 'android',
      'lang': lang,
      'appVersion': appVersion,
    });
    _registeredToken = token;
  }

  /// Stops notifications on this phone: removes it on the server (while the
  /// sign-in token still works) and drops the Firebase token. Used on sign-out
  /// and when the switch is turned off.
  Future<void> unregister() async {
    if (!_firebaseReady) return;
    try {
      await _refreshSub?.cancel();
      _refreshSub = null;
      final token = _registeredToken ?? await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await _client.dio.delete('/devices', data: {'token': token}).timeout(const Duration(seconds: 6));
      }
    } catch (e) {
      debugPrint('push unregister failed: $e');
    } finally {
      _registeredToken = null;
      try {
        await FirebaseMessaging.instance.deleteToken();
      } catch (_) {}
    }
  }

  /// The profile-tab switch.
  Future<void> setEnabled(bool enabled, Agent? agent, {required String lang, required String appVersion}) async {
    try {
      await (await SharedPreferences.getInstance()).setBool(_pushPrefKey, enabled);
    } catch (_) {}
    if (enabled) {
      await syncFor(agent, lang: lang, appVersion: appVersion);
    } else {
      await unregister();
    }
  }
}

final pushServiceProvider = Provider<PushService>((ref) => PushService(ref.watch(apiClientProvider)));
