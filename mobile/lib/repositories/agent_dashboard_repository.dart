import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../models/agent.dart';
import '../models/lead.dart';
import '../models/property.dart';

class AgentDashboardRepository {
  final ApiClient _client;
  AgentDashboardRepository(this._client);

  // Profile & settings
  Future<Agent> updateProfile(Map<String, dynamic> fields) async {
    final res = await _client.dio.patch('/agent/profile', data: fields);
    return Agent.fromJson((res.data as Map<String, dynamic>)['agent'] as Map<String, dynamic>);
  }

  Future<void> updateSettings({String? phone}) async {
    await _client.dio.patch('/agent/settings', data: {if (phone != null) 'phone': phone});
  }

  // Leads
  Future<(List<Lead> leads, int unreadCount)> getLeads() async {
    final res = await _client.dio.get('/agent/leads');
    final data = res.data as Map<String, dynamic>;
    final leads = (data['leads'] as List).map((e) => Lead.fromJson(e as Map<String, dynamic>)).toList();
    return (leads, data['unreadCount'] as int);
  }

  Future<void> markLeadRead(String id) => _client.dio.post('/agent/leads/$id/read');
  Future<void> deleteLead(String id) => _client.dio.delete('/agent/leads/$id');

  // Listings
  Future<List<Property>> getMyProperties() async {
    final res = await _client.dio.get('/agent/properties');
    return ((res.data as Map<String, dynamic>)['properties'] as List)
        .map((e) => Property.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Property> createProperty(Map<String, dynamic> formData, List<String> imageUrls) async {
    final res = await _client.dio.post('/agent/properties', data: {
      'formData': formData,
      'imageUrls': imageUrls,
    });
    return Property.fromJson((res.data as Map<String, dynamic>)['property'] as Map<String, dynamic>);
  }

  Future<Property> updateProperty(String id, Map<String, dynamic> formData, List<String> imageUrls) async {
    final res = await _client.dio.patch('/agent/properties/$id', data: {
      'formData': formData,
      'imageUrls': imageUrls,
    });
    return Property.fromJson((res.data as Map<String, dynamic>)['property'] as Map<String, dynamic>);
  }

  Future<void> deleteProperty(String id) => _client.dio.delete('/agent/properties/$id');

  Future<String> uploadImage(String base64, {String folder = 'houseinmozambique/houses'}) async {
    final res = await _client.dio.post('/agent/properties/upload-image', data: {
      'base64': base64,
      'folder': folder,
    });
    return (res.data as Map<String, dynamic>)['url'] as String;
  }
}

final agentDashboardRepositoryProvider =
    Provider<AgentDashboardRepository>((ref) => AgentDashboardRepository(ref.watch(apiClientProvider)));

final myPropertiesProvider = FutureProvider.autoDispose<List<Property>>((ref) {
  return ref.watch(agentDashboardRepositoryProvider).getMyProperties();
});

final myLeadsProvider = FutureProvider.autoDispose<(List<Lead>, int)>((ref) {
  return ref.watch(agentDashboardRepositoryProvider).getLeads();
});
