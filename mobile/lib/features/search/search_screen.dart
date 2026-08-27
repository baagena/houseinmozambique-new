import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../controllers/search_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../repositories/property_repository.dart';
import '../../widgets/error_view.dart';
import '../../widgets/favorites_fab.dart';
import '../../widgets/property_card.dart';
import '../../widgets/shimmer_loaders.dart';

const _propertyTypes = ['Villa', 'Apartment', 'House', 'Land', 'Commercial'];
const _cities = ['Maputo', 'Matola', 'Inhambane', 'Beira', 'Nampula', 'Tete', 'Pemba', 'Vilanculos'];

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(() {
      if (_scrollController.position.pixels > _scrollController.position.maxScrollExtent - 300) {
        ref.read(propertySearchControllerProvider.notifier).loadMore();
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _openFilters() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => const _FiltersSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(propertySearchControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('search.title'.tr()),
        actions: [
          IconButton(icon: const Icon(Icons.tune), onPressed: _openFilters),
        ],
      ),
      floatingActionButton: const FavoritesFab(heroTag: 'explore-favorites-fab'),
      body: Column(
        children: [
          SizedBox(
            // Chips keep their own tap-target height; the row just has to be
            // tall enough for it, otherwise they get squeezed and overflow.
            height: 56,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                _TypeChip(label: 'search.buy'.tr(), value: 'Buy', state: state),
                _TypeChip(label: 'search.rent'.tr(), value: 'Rent', state: state),
                _TypeChip(label: 'search.shortStay'.tr(), value: 'Short Stay', state: state),
              ],
            ),
          ),
          Expanded(
            child: state.isLoading
                ? const ListSkeleton()
                : state.error != null && state.results.isEmpty
                    ? ErrorView(
                        message: state.error.asApiException?.message,
                        onRetry: () => ref.read(propertySearchControllerProvider.notifier).search(),
                      )
                    : state.results.isEmpty
                        ? Center(child: Text('common.noResults'.tr()))
                        : GridView.builder(
                            controller: _scrollController,
                            padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              crossAxisSpacing: 12,
                              mainAxisSpacing: 16,
                              childAspectRatio: 0.8,
                            ),
                            itemCount: state.results.length + (state.hasMore ? 1 : 0),
                            itemBuilder: (context, index) {
                              if (index >= state.results.length) {
                                return const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()));
                              }
                              return PropertyCard(property: state.results[index], width: double.infinity, swipeableImages: true);
                            },
                          ),
          ),
        ],
      ),
    );
  }
}

class _TypeChip extends ConsumerWidget {
  final String label;
  final String value;
  final SearchState state;

  const _TypeChip({required this.label, required this.value, required this.state});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = state.filters.listingType == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Center(
        child: ChoiceChip(
          label: Text(label),
          selected: selected,
          onSelected: (_) => ref.read(propertySearchControllerProvider.notifier).updateFilters(
                (f) => PropertyFilters(
                  listingType: selected ? null : value,
                  city: f.city,
                  propertyType: f.propertyType,
                  minPrice: f.minPrice,
                  maxPrice: f.maxPrice,
                  bedrooms: f.bedrooms,
                  bathrooms: f.bathrooms,
                  sort: f.sort,
                ),
              ),
        ),
      ),
    );
  }
}

class _FiltersSheet extends ConsumerStatefulWidget {
  const _FiltersSheet();

  @override
  ConsumerState<_FiltersSheet> createState() => _FiltersSheetState();
}

class _FiltersSheetState extends ConsumerState<_FiltersSheet> {
  String? city;
  final Set<String> propertyTypes = {};
  int? bedrooms;
  String? sort;

  @override
  void initState() {
    super.initState();
    final f = ref.read(propertySearchControllerProvider).filters;
    city = f.city;
    propertyTypes.addAll(f.propertyType ?? []);
    bedrooms = f.bedrooms;
    sort = f.sort;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.outlineVariant, borderRadius: BorderRadius.circular(2))),
            ),
            const SizedBox(height: 16),
            Text('common.filter'.tr(), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Text('search.city'.tr(), style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _cities.map((c) {
                return ChoiceChip(
                  label: Text(c),
                  selected: city == c,
                  onSelected: (_) => setState(() => city = city == c ? null : c),
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
            Text('search.propertyType'.tr(), style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _propertyTypes.map((t) {
                return FilterChip(
                  label: Text(t),
                  selected: propertyTypes.contains(t),
                  onSelected: (sel) => setState(() => sel ? propertyTypes.add(t) : propertyTypes.remove(t)),
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
            Text('search.bedrooms'.tr(), style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [1, 2, 3, 4, 5].map((n) {
                return ChoiceChip(
                  label: Text('$n+'),
                  selected: bedrooms == n,
                  onSelected: (_) => setState(() => bedrooms = bedrooms == n ? null : n),
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
            Text('search.sort'.tr(), style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: {
                'newest': 'search.sortNewest'.tr(),
                'price_asc': 'search.sortPriceAsc'.tr(),
                'price_desc': 'search.sortPriceDesc'.tr(),
              }.entries.map((e) {
                return ChoiceChip(
                  label: Text(e.value),
                  selected: sort == e.key,
                  onSelected: (_) => setState(() => sort = sort == e.key ? null : e.key),
                );
              }).toList(),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => setState(() {
                      city = null;
                      propertyTypes.clear();
                      bedrooms = null;
                      sort = null;
                    }),
                    child: Text('common.clear'.tr()),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      ref.read(propertySearchControllerProvider.notifier).updateFilters(
                            (f) => PropertyFilters(
                              listingType: f.listingType,
                              city: city,
                              propertyType: propertyTypes.isEmpty ? null : propertyTypes.toList(),
                              bedrooms: bedrooms,
                              sort: sort,
                            ),
                          );
                      Navigator.of(context).pop();
                    },
                    child: Text('common.apply'.tr()),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
