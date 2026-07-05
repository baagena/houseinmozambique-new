import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../models/agent.dart';
import '../models/property.dart';

class AgentRepository {
  final ApiClient _client;
  AgentRepository(this._client);

  Future<List<Agent>> getAll() async {
    final res = await _client.dio.get('/agents');
    final data = res.data as Map<String, dynamic>;
    return (data['agents'] as List).map((e) => Agent.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<(Agent, List<Property>)> getById(String id) async {
    final res = await _client.dio.get('/agents/$id');
    final json = (res.data as Map<String, dynamic>)['agent'] as Map<String, dynamic>;
    final properties = (json['properties'] as List? ?? [])
        .map((e) => Property.fromJson(e as Map<String, dynamic>))
        .toList();
    return (Agent.fromJson(json), properties);
  }
}

final agentRepositoryProvider = Provider<AgentRepository>((ref) => AgentRepository(ref.watch(apiClientProvider)));
