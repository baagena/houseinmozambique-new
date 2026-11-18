// The search screen's controller against a fake server whose answers arrive
// out of order or fail — what a slow mobile connection actually does.

import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/controllers/search_controller.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/models/property.dart';
import 'package:mobile/repositories/property_repository.dart';

Property _p(String id, String listingType) => Property(
      id: id,
      title: id,
      description: '',
      location: 'Maputo',
      city: 'Maputo',
      price: 1000,
      priceUnit: listingType == 'Rent' ? 'monthly' : 'sale',
      type: 'House',
      listingType: listingType,
      bedrooms: 2,
      bathrooms: 1,
      area: 80,
      hostId: 'a1',
      status: 'PUBLISHED',
      createdAt: DateTime(2026, 1, 1),
    );

/// Each request waits for the test to complete it, so the test decides the
/// order answers arrive in.
class _ControlledRepo extends PropertyRepository {
  _ControlledRepo() : super(ApiClient());
  final pending = <PropertyFilters, Completer<PropertyPage>>{};
  final requests = <PropertyFilters>[];

  @override
  Future<PropertyPage> search(PropertyFilters filters) {
    requests.add(filters);
    final c = Completer<PropertyPage>();
    pending[filters] = c;
    return c.future;
  }

  void answer(PropertyFilters f, List<Property> props, {int page = 1, int totalPages = 1}) =>
      pending[f]!.complete(PropertyPage(properties: props, page: page, totalPages: totalPages, total: props.length));

  void fail(PropertyFilters f) => pending[f]!.completeError(ApiException('timeout'));

  PropertyFilters where(bool Function(PropertyFilters) test) => requests.lastWhere(test);
}

void main() {
  late _ControlledRepo repo;
  late ProviderContainer container;
  PropertySearchController ctrl() => container.read(propertySearchControllerProvider.notifier);
  SearchState state() => container.read(propertySearchControllerProvider);

  setUp(() async {
    repo = _ControlledRepo();
    container = ProviderContainer(overrides: [propertyRepositoryProvider.overrideWithValue(repo)]);
    container.read(propertySearchControllerProvider); // build → initial search
    await Future<void>.delayed(Duration.zero);
    repo.answer(repo.requests.first, [_p('any', 'Buy')], totalPages: 2);
    await Future<void>.delayed(Duration.zero);
  });
  tearDown(() => container.dispose());

  test('a slow older search cannot overwrite a newer one', () async {
    ctrl().updateFilters((f) => f.copyWith(listingType: 'Buy'));
    ctrl().updateFilters((f) => f.copyWith(listingType: 'Rent'));
    final buy = repo.where((f) => f.listingType == 'Buy');
    final rent = repo.where((f) => f.listingType == 'Rent');

    repo.answer(rent, [_p('r1', 'Rent')]); // Rent answers first…
    await Future<void>.delayed(Duration.zero);
    repo.answer(buy, [_p('b1', 'Buy')]); // …then the slow Buy answer arrives.
    await Future<void>.delayed(Duration.zero);

    expect(state().filters.listingType, 'Rent');
    expect(state().results.map((p) => p.id), ['r1']);
    expect(state().isLoading, isFalse);
  });

  test('a failed older search does not show an error over newer results', () async {
    ctrl().updateFilters((f) => f.copyWith(listingType: 'Buy'));
    ctrl().updateFilters((f) => f.copyWith(listingType: 'Rent'));
    repo.answer(repo.where((f) => f.listingType == 'Rent'), [_p('r1', 'Rent')]);
    await Future<void>.delayed(Duration.zero);
    repo.fail(repo.where((f) => f.listingType == 'Buy'));
    await Future<void>.delayed(Duration.zero);

    expect(state().error, isNull);
    expect(state().results.map((p) => p.id), ['r1']);
  });

  test("page 2 of an old filter is not appended to a new filter's results", () async {
    ctrl().loadMore(); // page 2 of the initial (all) search starts…
    final page2 = repo.requests.last;
    expect(page2.page, 2);
    ctrl().updateFilters((f) => f.copyWith(listingType: 'Rent')); // …filter changes
    repo.answer(repo.where((f) => f.listingType == 'Rent'), [_p('r1', 'Rent')]);
    await Future<void>.delayed(Duration.zero);
    repo.answer(page2, [_p('old2', 'Buy')], page: 2, totalPages: 2);
    await Future<void>.delayed(Duration.zero);

    expect(state().results.map((p) => p.id), ['r1']);
  });

  test('a failed page load stops retrying until the user taps retry', () async {
    ctrl().loadMore();
    repo.fail(repo.requests.last);
    await Future<void>.delayed(Duration.zero);
    expect(state().loadMoreFailed, isTrue);
    expect(state().results.map((p) => p.id), ['any']); // the list is kept

    final before = repo.requests.length;
    ctrl().loadMore(); // scrolling again must not fire another request
    ctrl().loadMore();
    expect(repo.requests.length, before);

    ctrl().retryLoadMore();
    expect(repo.requests.length, before + 1);
    repo.answer(repo.requests.last, [_p('more', 'Buy')], page: 2, totalPages: 2);
    await Future<void>.delayed(Duration.zero);
    expect(state().results.map((p) => p.id), ['any', 'more']);
    expect(state().loadMoreFailed, isFalse);
  });
}
