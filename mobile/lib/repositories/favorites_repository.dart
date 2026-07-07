import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';

class FavoritesRepository {
  final ApiClient _client;
  FavoritesRepository(this._client);

  Future<Set<String>> list() async {
    final res = await _client.dio.get('/favorites');
    final ids = (res.data as Map<String, dynamic>)['propertyIds'] as List;
    return ids.map((e) => e.toString()).toSet();
  }

  Future<void> add(String propertyId) async {
    await _client.dio.post('/favorites', data: {'propertyId': propertyId});
  }

  Future<void> remove(String propertyId) async {
    await _client.dio.delete('/favorites/$propertyId');
  }

  Future<Set<String>> merge(Set<String> localPropertyIds) async {
    final res = await _client.dio.post('/favorites/merge', data: {'propertyIds': localPropertyIds.toList()});
    final ids = (res.data as Map<String, dynamic>)['propertyIds'] as List;
    return ids.map((e) => e.toString()).toSet();
  }
}

final favoritesRepositoryProvider = Provider<FavoritesRepository>((ref) => FavoritesRepository(ref.watch(apiClientProvider)));
