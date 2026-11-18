import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../controllers/favorites_controller.dart';
import '../../core/network/api_client.dart';
import '../../models/property.dart';
import '../../repositories/property_repository.dart';
import '../../widgets/error_view.dart';
import '../../widgets/property_card.dart';
import '../../widgets/shimmer_loaders.dart';

final favoritePropertiesProvider = FutureProvider.autoDispose<List<Property>>((ref) async {
  final ids = ref.watch(favoritesControllerProvider);
  final repo = ref.watch(propertyRepositoryProvider);
  final properties = <Property>[];
  final gone = <String>{};
  Object? failure;
  for (final id in ids) {
    try {
      final (property, _) = await repo.getById(id);
      properties.add(property);
    } catch (e) {
      // 404: deleted, sold or unpublished since it was saved — drop it from
      // the saved list, or the counter keeps a listing nobody can open.
      // Anything else (no signal, server slow) keeps it for next time.
      if (e.asApiException?.statusCode == 404) {
        gone.add(id);
      } else {
        failure ??= e;
      }
    }
  }
  if (gone.isNotEmpty) {
    // After this build: changing the saved ids re-runs this provider.
    Future.microtask(() => ref.read(favoritesControllerProvider.notifier).forget(gone));
  }
  // Nothing could be loaded because of the connection: say so (with retry)
  // instead of "you haven't saved anything".
  if (properties.isEmpty && failure != null) throw failure;
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
              childAspectRatio: 0.8,
            ),
            itemCount: properties.length,
            itemBuilder: (context, index) => PropertyCard(property: properties[index], width: double.infinity, swipeableImages: true),
          );
        },
      ),
    );
  }
}
