import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/property.dart';
import '../repositories/property_repository.dart';
import '../services/firebase_services.dart';

class SearchState {
  final PropertyFilters filters;
  final List<Property> results;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final Object? error;
  /// Loading the next page failed: the list footer offers a retry instead of
  /// spinning forever and re-requesting on every scroll tick.
  final bool loadMoreFailed;

  const SearchState({
    this.filters = const PropertyFilters(),
    this.results = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.hasMore = true,
    this.error,
    this.loadMoreFailed = false,
  });

  SearchState copyWith({
    PropertyFilters? filters,
    List<Property>? results,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    Object? error,
    bool clearError = false,
    bool? loadMoreFailed,
  }) {
    return SearchState(
      filters: filters ?? this.filters,
      results: results ?? this.results,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      error: clearError ? null : (error ?? this.error),
      loadMoreFailed: loadMoreFailed ?? this.loadMoreFailed,
    );
  }
}

class PropertySearchController extends Notifier<SearchState> {
  @override
  SearchState build() {
    Future.microtask(search);
    return const SearchState();
  }

  /// Bumped by every new search. A response that arrives after a newer
  /// search started is dropped: tapping "Buy" then "Rent" quickly used to show
  /// whichever answered last — Buy results under a highlighted Rent chip —
  /// and a page-2 load could append the old filter's listings to new results.
  int _generation = 0;

  Future<void> search() async {
    final gen = ++_generation;
    final filters = state.filters.copyWith(page: 1);
    state = state.copyWith(isLoading: true, isLoadingMore: false, clearError: true, loadMoreFailed: false);
    Analytics.search([filters.listingType, filters.city, ...?filters.propertyType].whereType<String>().where((s) => s.isNotEmpty).join(' '));
    try {
      final page = await ref.read(propertyRepositoryProvider).search(filters);
      if (gen != _generation) return;
      state = state.copyWith(
        results: page.properties,
        isLoading: false,
        hasMore: page.page < page.totalPages,
        filters: filters,
      );
    } catch (e) {
      if (gen != _generation) return;
      state = state.copyWith(isLoading: false, error: e);
    }
  }

  Future<void> loadMore() async {
    if (state.isLoading || state.isLoadingMore || !state.hasMore || state.loadMoreFailed) return;
    final gen = _generation;
    final filters = state.filters.copyWith(page: state.filters.page + 1);
    state = state.copyWith(isLoadingMore: true);
    try {
      final page = await ref.read(propertyRepositoryProvider).search(filters);
      if (gen != _generation) return;
      state = state.copyWith(
        results: [...state.results, ...page.properties],
        isLoadingMore: false,
        hasMore: page.page < page.totalPages,
        filters: filters,
      );
    } catch (e) {
      if (gen != _generation) return;
      state = state.copyWith(isLoadingMore: false, loadMoreFailed: true);
    }
  }

  /// The footer's retry button after a failed page load.
  Future<void> retryLoadMore() {
    state = state.copyWith(loadMoreFailed: false);
    return loadMore();
  }

  void updateFilters(PropertyFilters Function(PropertyFilters) update) {
    state = state.copyWith(filters: update(state.filters));
    search();
  }
}

final propertySearchControllerProvider =
    NotifierProvider<PropertySearchController, SearchState>(PropertySearchController.new);
