import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../models/property.dart';
import '../models/agent.dart';
import '../models/ad.dart';

class HomeData {
  final List<Property> featured;
  final List<Agent> featuredAgents;
  final Map<String, List<Property>> cities;
  final Map<String, List<Property>> listingTypes;
  final List<Ad> ads;

  HomeData({
    required this.featured,
    required this.featuredAgents,
    required this.cities,
    required this.listingTypes,
    required this.ads,
  });
}

class HomeRepository {
  final ApiClient _client;
  HomeRepository(this._client);

  Future<HomeData> getHome() async {
    final res = await _client.dio.get('/home');
    final data = res.data as Map<String, dynamic>;

    List<Property> propList(dynamic raw) =>
        (raw as List).map((e) => Property.fromJson(e as Map<String, dynamic>)).toList();

    final citiesRaw = data['cities'] as Map<String, dynamic>;
    final listingTypesRaw = data['listingTypes'] as Map<String, dynamic>;

    return HomeData(
      featured: propList(data['featured']),
      featuredAgents: (data['featuredAgents'] as List)
          .map((e) => Agent.fromJson(e as Map<String, dynamic>))
          .toList(),
      cities: citiesRaw.map((key, value) => MapEntry(key, propList(value))),
      listingTypes: listingTypesRaw.map((key, value) => MapEntry(key, propList(value))),
      ads: (data['ads'] as List).map((e) => Ad.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }
}

final homeRepositoryProvider = Provider<HomeRepository>((ref) => HomeRepository(ref.watch(apiClientProvider)));

final homeDataProvider = FutureProvider.autoDispose<HomeData>((ref) {
  return ref.watch(homeRepositoryProvider).getHome();
});
