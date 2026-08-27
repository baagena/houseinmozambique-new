import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../controllers/favorites_controller.dart';
import '../core/theme/app_theme.dart';
import '../models/property.dart';

class PropertyCard extends ConsumerStatefulWidget {
  final Property property;
  final double width;
  final String? heroTag;

  /// True inside vertically scrolling lists/grids: photos become a manually
  /// swipeable carousel with dots. False (default) in horizontally scrolling
  /// rows, where an image swipe would fight the row scroll — those cards show
  /// the cover photo with a photo-count badge instead. No auto-rotation
  /// anywhere: it reads as restless and silently burns mobile data.
  final bool swipeableImages;

  const PropertyCard({
    super.key,
    required this.property,
    this.width = 260,
    this.heroTag,
    this.swipeableImages = false,
  });

  @override
  ConsumerState<PropertyCard> createState() => _PropertyCardState();
}

class _PropertyCardState extends ConsumerState<PropertyCard> {
  int _currentImage = 0;

  Property get property => widget.property;

  Widget _image(String url) => CachedNetworkImage(
        imageUrl: url,
        fit: BoxFit.cover,
        placeholder: (context, url) => Container(color: AppColors.surfaceVariant),
        errorWidget: (context, url, error) =>
            Container(color: AppColors.surfaceVariant, child: const Icon(Icons.home_outlined)),
      );

  @override
  Widget build(BuildContext context) {
    final isFavorite = ref.watch(favoritesControllerProvider).contains(property.id);
    final tag = widget.heroTag ?? 'property-image-${property.id}';
    final images = property.images;
    final swipeable = widget.swipeableImages && images.length > 1;

    return GestureDetector(
      onTap: () => context.push('/property/${property.id}', extra: {'heroTag': tag}),
      child: SizedBox(
        width: widget.width,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // The photo takes whatever height is left after the text block, so
            // the price line can never be clipped by the fixed row/grid height
            // (it used to, at larger system font sizes).
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Hero(
                    tag: tag,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: images.isEmpty
                          ? Container(color: AppColors.surfaceVariant)
                          : swipeable
                              ? PageView.builder(
                                  itemCount: images.length,
                                  onPageChanged: (i) => setState(() => _currentImage = i),
                                  itemBuilder: (context, i) => _image(images[i]),
                                )
                              : _image(property.coverImage),
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
                        child: Text('property.featured'.tr(), style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600)),
                      ),
                    ),
                  if (swipeable)
                    Positioned(
                      left: 0,
                      right: 0,
                      bottom: 8,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(images.length, (i) {
                          return AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            width: i == _currentImage ? 14 : 5,
                            height: 5,
                            margin: const EdgeInsets.symmetric(horizontal: 2),
                            decoration: BoxDecoration(
                              color: i == _currentImage ? Colors.white : Colors.white54,
                              borderRadius: BorderRadius.circular(3),
                            ),
                          );
                        }),
                      ),
                    )
                  else if (images.length > 1)
                    Positioned(
                      left: 8,
                      bottom: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.black45,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.photo_library_outlined, size: 11, color: Colors.white),
                            const SizedBox(width: 3),
                            Text('${images.length}', style: const TextStyle(color: Colors.white, fontSize: 10.5, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
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
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.primary),
            ),
          ],
        ),
      ),
    );
  }
}
