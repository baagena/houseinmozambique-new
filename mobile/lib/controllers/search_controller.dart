import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/property.dart';
import '../repositories/property_repository.dart';

class SearchState {
  final PropertyFilters filters;
  final List<Property> results;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final Object? error;

  const SearchState({
    this.filters = const PropertyFilters(),
    this.results = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.hasMore = true,
    this.error,
  });

  SearchState copyWith({
    PropertyFilters? filters,
    List<Property>? results,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    Object? error,
    bool clearError = false,
  }) {
    return SearchState(
      filters: filters ?? this.filters,
      results: results ?? this.results,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class PropertySearchController extends Notifier<SearchState> {
  @override
  SearchState build() {
    Future.microtask(search);
    return const SearchState();
  }

  Future<void> search() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final page = await ref.read(propertyRepositoryProvider).search(state.filters.copyWith(page: 1));
      state = state.copyWith(
        results: page.properties,
        isLoading: false,
        hasMore: page.page < page.totalPages,
        filters: state.filters.copyWith(page: 1),
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e);
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    state = state.copyWith(isLoadingMore: true);
    try {
      final nextPage = state.filters.page + 1;
      final page = await ref.read(propertyRepositoryProvider).search(state.filters.copyWith(page: nextPage));
      state = state.copyWith(
        results: [...state.results, ...page.properties],
        isLoadingMore: false,
        hasMore: page.page < page.totalPages,
        filters: state.filters.copyWith(page: nextPage),
      );
    } catch (e) {
      state = state.copyWith(isLoadingMore: false, error: e);
    }
  }

  void updateFilters(PropertyFilters Function(PropertyFilters) update) {
    state = state.copyWith(filters: update(state.filters));
    search();
  }
}

final propertySearchControllerProvider =
    NotifierProvider<PropertySearchController, SearchState>(PropertySearchController.new);
