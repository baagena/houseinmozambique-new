import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../models/agent.dart';

class AuthRepository {
  final ApiClient _client;
  AuthRepository(this._client);

  Future<(String token, Agent agent)> login(String email, String password) async {
    final res = await _client.dio.post('/auth/login', data: {'email': email, 'password': password});
    final data = res.data as Map<String, dynamic>;
    return (data['token'] as String, Agent.fromJson(data['agent'] as Map<String, dynamic>));
  }

  Future<(String token, Agent agent)> register({
    required String email,
    required String password,
    required String name,
    String role = 'AGENT',
    String? phone,
    String? title,
    String? location,
    int? yearsExperience,
    String? bio,
    List<String>? specializations,
  }) async {
    final res = await _client.dio.post('/auth/register', data: {
      'email': email,
      'password': password,
      'name': name,
      'role': role,
      if (phone != null) 'phone': phone,
      if (title != null) 'title': title,
      if (location != null) 'location': location,
      if (yearsExperience != null) 'yearsExperience': yearsExperience,
      if (bio != null) 'bio': bio,
      if (specializations != null) 'specializations': specializations,
    });
    final data = res.data as Map<String, dynamic>;
    return (data['token'] as String, Agent.fromJson(data['agent'] as Map<String, dynamic>));
  }

  Future<Agent> me() async {
    final res = await _client.dio.get('/auth/me');
    return Agent.fromJson((res.data as Map<String, dynamic>)['agent'] as Map<String, dynamic>);
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) => AuthRepository(ref.watch(apiClientProvider)));
