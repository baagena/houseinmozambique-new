// Saved listings: the count must always match what the saved list can show.
// A listing deleted/unpublished after it was saved used to stay counted
// forever ("one favourite that is not there"), and every account on the phone
// shared one list.

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:mobile/controllers/auth_controller.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/storage/favorites_storage.dart';
import 'package:mobile/controllers/favorites_controller.dart';
import 'package:mobile/features/favorites/favorites_screen.dart';
import 'package:mobile/models/agent.dart';
import 'package:mobile/models/property.dart';
import 'package:mobile/repositories/property_repository.dart';

class _Auth extends AuthController {
  final Agent? agent;
  _Auth(this.agent);
  @override
  AuthState build() =>
      AuthState(status: agent == null ? AuthStatus.unauthenticated : AuthStatus.authenticated, agent: agent);
}

/// 'live' exists; 'gone' answers 404; 'offline' fails with no connection.
class _Repo extends PropertyRepository {
  _Repo() : super(ApiClient());
  @override
  Future<(Property, List<Property>)> getById(String id) async {
    if (id == 'gone') throw ApiException('Property not found', statusCode: 404);
    if (id == 'offline') throw ApiException('No internet', isNetworkError: true);
    return (
      Property(
        id: id,
        title: 'Listing $id',
        description: '',
        location: 'Maputo',
        city: 'Maputo',
        price: 100,
        priceUnit: 'total',
        type: 'House',
        listingType: 'Sale',
        bedrooms: 2,
        bathrooms: 1,
        area: 100,
        hostId: 'h1',
        status: 'PUBLISHED',
        createdAt: DateTime(2026),
        images: const [],
      ),
      <Property>[],
    );
  }
}

Agent _owner(String id) =>
    Agent(id: id, name: 'Owner $id', initials: 'O', title: 'Owner', location: 'Maputo', role: 'OWNER');

ProviderContainer _container({Agent? signedIn}) {
  final c = ProviderContainer(overrides: [
    authControllerProvider.overrideWith(() => _Auth(signedIn)),
    propertyRepositoryProvider.overrideWithValue(_Repo()),
  ]);
  addTearDown(c.dispose);
  return c;
}

Future<void> _settle() => Future<void>.delayed(const Duration(milliseconds: 50));

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  test('a saved listing that no longer exists is removed, so the count matches', () async {
    await FavoritesStorage.toggle('live');
    await FavoritesStorage.toggle('gone');
    final c = _container();
    c.listen(favoritesControllerProvider, (_, __) {});
    await _settle();
    expect(c.read(favoritesControllerProvider), {'live', 'gone'});

    final shown = await c.read(favoritePropertiesProvider.future);
    expect(shown.map((p) => p.id), ['live']);
    await _settle();

    expect(c.read(favoritesControllerProvider), {'live'}); // the counter now says 1
    expect(await FavoritesStorage.getAll(), {'live'}); // and it stays fixed
  });

  test('no connection never deletes saves, and shows an error instead of "nothing saved"', () async {
    await FavoritesStorage.toggle('offline');
    final c = _container();
    c.listen(favoritesControllerProvider, (_, __) {});
    await _settle();
    c.listen(favoritePropertiesProvider, (_, __) {}); // keep it alive while loading
    await _settle();
    // Riverpod keeps retrying in the background; the error is what the screen shows.
    expect(c.read(favoritePropertiesProvider).error, isA<ApiException>());
    await _settle();
    expect(c.read(favoritesControllerProvider), {'offline'});
  });

  test('each account on the phone has its own saved list', () async {
    final a = _container(signedIn: _owner('owner-a'));
    a.listen(favoritesControllerProvider, (_, __) {});
    await _settle();
    await a.read(favoritesControllerProvider.notifier).toggle('live');
    expect(a.read(favoritesControllerProvider), {'live'});

    final b = _container(signedIn: _owner('owner-b'));
    b.listen(favoritesControllerProvider, (_, __) {});
    await _settle();
    expect(b.read(favoritesControllerProvider), isEmpty);

    final guest = _container();
    guest.listen(favoritesControllerProvider, (_, __) {});
    await _settle();
    expect(guest.read(favoritesControllerProvider), isEmpty);
  });
}
