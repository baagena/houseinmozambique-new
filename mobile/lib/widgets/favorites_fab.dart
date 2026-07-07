import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../controllers/favorites_controller.dart';
import '../core/theme/app_theme.dart';

/// Floating shortcut to the saved-properties list. Shown only on screens
/// where favoriting makes sense (listing grids, property detail) — Favorites
/// is no longer a permanent bottom-nav tab, so this is how it stays reachable.
class FavoritesFab extends ConsumerWidget {
  final String heroTag;
  const FavoritesFab({super.key, required this.heroTag});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(favoritesControllerProvider).length;
    return FloatingActionButton(
      heroTag: heroTag,
      onPressed: () => context.push('/favorites'),
      backgroundColor: AppColors.surfaceContainerLowest,
      foregroundColor: AppColors.primary,
      child: Badge(
        isLabelVisible: count > 0,
        label: Text('$count'),
        backgroundColor: AppColors.secondary,
        child: const Icon(Icons.favorite_outline),
      ),
    );
  }
}
