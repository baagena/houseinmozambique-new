import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../core/network/api_config.dart';
import '../models/agent.dart';
import '../models/property.dart';
import '../models/advertisement.dart';
import '../models/blog_post.dart';
import '../models/lead.dart';

class AdminRepository {
  final ApiClient _client;
  AdminRepository(this._client);

  // Agents
  Future<List<Agent>> getAgents() async {
    final res = await _client.dio.get('/admin/agents');
    return ((res.data as Map<String, dynamic>)['agents'] as List)
        .map((e) => Agent.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Agent> createAgent(Map<String, dynamic> fields) async {
    final res = await _client.dio.post('/admin/agents', data: fields);
    return Agent.fromJson((res.data as Map<String, dynamic>)['agent'] as Map<String, dynamic>);
  }

  Future<Agent> updateAgent(String id, Map<String, dynamic> fields) async {
    final res = await _client.dio.patch('/admin/agents/$id', data: fields);
    return Agent.fromJson((res.data as Map<String, dynamic>)['agent'] as Map<String, dynamic>);
  }

  Future<void> deleteAgent(String id) => _client.dio.delete('/admin/agents/$id');

  Future<void> revokeAgent(String id) => _client.dio.post('/admin/agents/$id/revoke');

  // Properties
  Future<List<Property>> getProperties({String? status}) async {
    final res = await _client.dio.get('/admin/properties', queryParameters: {
      if (status != null) 'status': status,
    });
    return ((res.data as Map<String, dynamic>)['properties'] as List)
        .map((e) => Property.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Property> updateProperty(String id, Map<String, dynamic> fields) async {
    final res = await _client.dio.patch('/admin/properties/$id', data: fields);
    return Property.fromJson((res.data as Map<String, dynamic>)['property'] as Map<String, dynamic>);
  }

  Future<void> setPropertyStatus(String id, String status) =>
      _client.dio.post('/admin/properties/$id/status', data: {'status': status});

  Future<void> deleteProperty(String id) => _client.dio.delete('/admin/properties/$id');

  // Ads
  Future<List<Advertisement>> getAds() async {
    final res = await _client.dio.get('/admin/ads');
    return ((res.data as Map<String, dynamic>)['ads'] as List)
        .map((e) => Advertisement.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Advertisement> createAd(Map<String, dynamic> fields) async {
    final res = await _client.dio.post('/admin/ads', data: fields);
    return Advertisement.fromJson((res.data as Map<String, dynamic>)['ad'] as Map<String, dynamic>);
  }

  Future<Advertisement> updateAd(String id, Map<String, dynamic> fields) async {
    final res = await _client.dio.patch('/admin/ads/$id', data: fields);
    return Advertisement.fromJson((res.data as Map<String, dynamic>)['ad'] as Map<String, dynamic>);
  }

  Future<void> deleteAd(String id) => _client.dio.delete('/admin/ads/$id');

  // Blog
  Future<List<BlogPost>> getBlogPosts() async {
    final res = await _client.dio.get('/admin/blog');
    return ((res.data as Map<String, dynamic>)['posts'] as List)
        .map((e) => BlogPost.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<BlogPost> createBlogPost(Map<String, dynamic> fields) async {
    final res = await _client.dio.post('/admin/blog', data: fields);
    return BlogPost.fromJson((res.data as Map<String, dynamic>)['post'] as Map<String, dynamic>);
  }

  Future<BlogPost> updateBlogPost(String id, Map<String, dynamic> fields) async {
    final res = await _client.dio.patch('/admin/blog/$id', data: fields);
    return BlogPost.fromJson((res.data as Map<String, dynamic>)['post'] as Map<String, dynamic>);
  }

  Future<void> deleteBlogPost(String id) => _client.dio.delete('/admin/blog/$id');

  // Activities (inquiries)
  Future<List<Lead>> getActivities() async {
    final res = await _client.dio.get('/admin/activities');
    return ((res.data as Map<String, dynamic>)['inquiries'] as List)
        .map((e) => Lead.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ── Parity with the web console ─────────────────────────────────────────
  // Reads come from /api/mobile/v1/admin/*; writes go to the website's own
  // /api/admin/* routes, which accept the app's bearer token, so both apps run
  // exactly the same server logic.

  Future<Map<String, dynamic>> _getMap(String path, [Map<String, dynamic>? query]) async {
    final res = await _client.dio.get(path, queryParameters: query);
    return Map<String, dynamic>.from(res.data as Map);
  }

  String _web(String path) => '${ApiConfig.rootUrl}/api$path';

  Future<Map<String, dynamic>> getOverview() => _getMap('/admin/overview');

  // Leads
  Future<Map<String, dynamic>> getLeads() => _getMap('/admin/leads');
  Future<void> replyToLead(String id, {required String body, String? subject}) =>
      _client.dio.post(_web('/admin/inquiries/$id/reply'), data: {
        'body': body,
        if (subject != null && subject.isNotEmpty) 'subject': subject,
      });
  Future<void> markLeadRead(String id) => _client.dio.post(_web('/inquiries/$id/read'));

  // Property requests
  Future<Map<String, dynamic>> getRequests() => _getMap('/admin/requests');
  /// action: release | reject | close. A note is required to reject.
  Future<Map<String, dynamic>> decideRequest(String id, String action, {String note = ''}) async {
    final res = await _client.dio.post(_web('/admin/property-requests/$id'), data: {'action': action, 'note': note});
    return Map<String, dynamic>.from(res.data as Map);
  }

  // Payments
  Future<Map<String, dynamic>> getVerifyQueue() => _getMap('/admin/payments/verify');
  Future<Map<String, dynamic>> verifyPayment(String id, String action, {String note = '', int? receivedMinor}) async {
    final res = await _client.dio.post(_web('/admin/payments/$id/verify'), data: {
      'action': action,
      'note': note,
      if (receivedMinor != null) 'receivedMinor': receivedMinor,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> getLedger({String status = 'all', String q = ''}) =>
      _getMap('/admin/payments', {'status': status, if (q.isNotEmpty) 'q': q});

  // Pricing plans. PUT replaces the whole plan, so callers send the full record.
  Future<List<Map<String, dynamic>>> getPricingPlans() async {
    final res = await _client.dio.get(_web('/admin/pricing'));
    return (res.data as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<void> savePricingPlan(Map<String, dynamic> plan) {
    final id = plan['id'] as String?;
    return id == null
        ? _client.dio.post(_web('/admin/pricing'), data: plan)
        : _client.dio.put(_web('/admin/pricing/$id'), data: plan);
  }

  Future<void> deletePricingPlan(String id) => _client.dio.delete(_web('/admin/pricing/$id'));

  // Subscribers
  Future<List<Map<String, dynamic>>> getSubscribers() async {
    final res = await _client.dio.get(_web('/admin/subscribers'));
    return (res.data as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<void> addSubscriber(String email) => _client.dio.post(_web('/admin/subscribers'), data: {'email': email});
  Future<void> setSubscriberActive(String id, bool isActive) =>
      _client.dio.patch(_web('/admin/subscribers/$id'), data: {'isActive': isActive});
  Future<void> deleteSubscriber(String id) => _client.dio.delete(_web('/admin/subscribers/$id'));
  Future<Map<String, dynamic>> broadcast({required String subject, required String body}) async {
    final res = await _client.dio.post(_web('/admin/subscribers/broadcast'), data: {'subject': subject, 'body': body});
    return Map<String, dynamic>.from(res.data as Map);
  }

  // Grant a plan by hand
  Future<Map<String, dynamic>> getAgentPlanInfo(String agentId) => _getMap('/admin/agents/$agentId/plan-info');
  /// No payment proof: an admin granting access has already decided.
  Future<void> grantPlan(String agentId, {required String planSlug, int months = 1, String note = ''}) =>
      _client.dio.post(_web('/admin/agent/$agentId/plan'), data: {
        'planSlug': planSlug,
        'months': months,
        'note': note,
      });

  // Site text ("Edit pages")
  Future<Map<String, dynamic>> getContent() => _getMap('/admin/content');
  /// An empty value resets the key to the built-in default.
  Future<void> saveContent(List<Map<String, String>> updates) =>
      _client.dio.post(_web('/admin/content'), data: {'updates': updates});
}

final adminRepositoryProvider = Provider<AdminRepository>((ref) => AdminRepository(ref.watch(apiClientProvider)));

final adminAgentsProvider = FutureProvider.autoDispose<List<Agent>>((ref) {
  return ref.watch(adminRepositoryProvider).getAgents();
});

final adminAllPropertiesProvider = FutureProvider.autoDispose<List<Property>>((ref) {
  return ref.watch(adminRepositoryProvider).getProperties();
});

final adminPendingPropertiesProvider = FutureProvider.autoDispose<List<Property>>((ref) {
  return ref.watch(adminRepositoryProvider).getProperties(status: 'PENDING');
});

final adminAdsProvider = FutureProvider.autoDispose<List<Advertisement>>((ref) {
  return ref.watch(adminRepositoryProvider).getAds();
});

final adminBlogPostsProvider = FutureProvider.autoDispose<List<BlogPost>>((ref) {
  return ref.watch(adminRepositoryProvider).getBlogPosts();
});

final adminActivitiesProvider = FutureProvider.autoDispose<List<Lead>>((ref) {
  return ref.watch(adminRepositoryProvider).getActivities();
});

final adminOverviewProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) {
  return ref.watch(adminRepositoryProvider).getOverview();
});

final adminLeadsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) {
  return ref.watch(adminRepositoryProvider).getLeads();
});

final adminRequestsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) {
  return ref.watch(adminRepositoryProvider).getRequests();
});

final adminVerifyQueueProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) {
  return ref.watch(adminRepositoryProvider).getVerifyQueue();
});

final adminPricingProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) {
  return ref.watch(adminRepositoryProvider).getPricingPlans();
});

final adminSubscribersProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) {
  return ref.watch(adminRepositoryProvider).getSubscribers();
});

final adminContentProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) {
  return ref.watch(adminRepositoryProvider).getContent();
});

final adminAgentPlanInfoProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, id) {
  return ref.watch(adminRepositoryProvider).getAgentPlanInfo(id);
});
