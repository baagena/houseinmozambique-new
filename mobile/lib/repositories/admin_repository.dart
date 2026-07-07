import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
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
