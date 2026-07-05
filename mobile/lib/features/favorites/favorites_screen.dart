import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../controllers/favorites_controller.dart';
import '../../models/property.dart';
import '../../repositories/property_repository.dart';
import '../../widgets/error_view.dart';
import '../../widgets/property_card.dart';
import '../../widgets/shimmer_loaders.dart';

final favoritePropertiesProvider = FutureProvider.autoDispose<List<Property>>((ref) async {
  final ids = ref.watch(favoritesControllerProvider);
  final repo = ref.watch(propertyRepositoryProvider);
  final properties = <Property>[];
  for (final id in ids) {
    try {
      final (property, _) = await repo.getById(id);
      properties.add(property);
    } catch (_) {
      // Listing may have been removed/unpublished since it was favorited — skip it.
    }
  }
  return properties;
});

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final favoritesAsync = ref.watch(favoritePropertiesProvider);

    return Scaffold(
      appBar: AppBar(title: Text('favorites.title'.tr())),
      body: favoritesAsync.when(
        loading: () => const ListSkeleton(),
        error: (err, st) => ErrorView(onRetry: () => ref.invalidate(favoritePropertiesProvider)),
        data: (properties) {
          if (properties.isEmpty) {
            return EmptyView(
              icon: Icons.favorite_border,
              title: 'favorites.empty'.tr(),
              body: 'favorites.emptyBody'.tr(),
            );
          }
          return GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 16,
              childAspectRatio: 0.68,
            ),
            itemCount: properties.length,
            itemBuilder: (context, index) => PropertyCard(property: properties[index], width: double.infinity),
          );
        },
      ),
    );
  }
}
