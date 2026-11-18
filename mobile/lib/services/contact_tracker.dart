import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/network/api_client.dart';
import '../core/network/api_config.dart';
import 'firebase_services.dart';

/// Records that someone pressed a contact button, so agents (and the team)
/// can see how people reached them — the same records the website writes.
///
/// Fire-and-forget: the call, WhatsApp chat or link opens whatever happens
/// here. Sent with the signed-in token when there is one, so an agent
/// pressing their own buttons is not counted (the server checks).
class ContactTracker {
  final ApiClient _client;
  ContactTracker(this._client);

  /// A press on a listing: whatsapp | call | email | form | viewing.
  /// (Google Analytics is logged by the launchers in agent_contact.dart.)
  void listing(String propertyId, String event) {
    _send('${ApiConfig.rootUrl}/api/property/$propertyId/engagement', {'event': event});
  }

  /// A press on an agent's profile: whatsapp | call | email | form | website
  /// | facebook | instagram | linkedin | tiktok | youtube | x.
  void profile(String agentId, String channel) {
    Analytics.contactAgent(channel);
    _send('${ApiConfig.rootUrl}/api/agents/$agentId/contact', {'channel': channel});
  }

  void _send(String url, Map<String, dynamic> body) {
    unawaited(
      _client.dio.post(url, data: body).timeout(const Duration(seconds: 10)).then((_) {}, onError: (Object e) {
        debugPrint('contact tracking failed: $e');
      }),
    );
  }
}

final contactTrackerProvider = Provider<ContactTracker>((ref) => ContactTracker(ref.watch(apiClientProvider)));
