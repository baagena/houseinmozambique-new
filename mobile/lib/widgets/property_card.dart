import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../controllers/favorites_controller.dart';
import '../core/theme/app_theme.dart';
import '../models/property.dart';

class PropertyCard extends ConsumerWidget {
  final Property property;
  final double width;
  final String? heroTag;

  const PropertyCard({super.key, required this.property, this.width = 260, this.heroTag});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isFavorite = ref.watch(favoritesControllerProvider).contains(property.id);
    final tag = heroTag ?? 'property-image-${property.id}';

    return GestureDetector(
      onTap: () => context.push('/property/${property.id}', extra: {'heroTag': tag}),
      child: SizedBox(
        width: width,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                Hero(
                  tag: tag,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: AspectRatio(
                      aspectRatio: 4 / 3,
                      child: property.coverImage.isEmpty
                          ? Container(color: AppColors.surfaceVariant)
                          : CachedNetworkImage(
                              imageUrl: property.coverImage,
                              fit: BoxFit.cover,
                              placeholder: (context, url) => Container(color: AppColors.surfaceVariant),
                              errorWidget: (context, url, error) =>
                                  Container(color: AppColors.surfaceVariant, child: const Icon(Icons.home_outlined)),
                            ),
                    ),
                  ),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: GestureDetector(
                    onTap: () => ref.read(favoritesControllerProvider.notifier).toggle(property.id),
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: const BoxDecoration(color: Colors.black38, shape: BoxShape.circle),
                      child: Icon(
                        isFavorite ? Icons.favorite : Icons.favorite_border,
                        color: isFavorite ? AppColors.tertiaryContainer : Colors.white,
                        size: 18,
                      ),
                    ),
                  ),
                ),
                if (property.isFeatured)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.secondary,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text('Featured', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600)),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              property.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            ),
            const SizedBox(height: 2),
            Text(
              property.location,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12),
            ),
            const SizedBox(height: 4),
            Text(
              property.priceLabel('MT '),
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.primary),
            ),
          ],
        ),
      ),
    );
  }
}
