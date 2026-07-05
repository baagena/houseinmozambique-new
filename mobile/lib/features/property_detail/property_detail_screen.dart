import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../controllers/favorites_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../models/property.dart';
import '../../repositories/property_repository.dart';
import '../../widgets/error_view.dart';
import '../../widgets/property_card.dart';

final propertyDetailProvider =
    FutureProvider.autoDispose.family<(Property, List<Property>), String>((ref, id) {
  return ref.watch(propertyRepositoryProvider).getById(id);
});

class PropertyDetailScreen extends ConsumerWidget {
  final String propertyId;
  final String? heroTag;
  const PropertyDetailScreen({super.key, required this.propertyId, this.heroTag});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(propertyDetailProvider(propertyId));

    return Scaffold(
      body: detailAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, st) => Scaffold(
          appBar: AppBar(),
          body: ErrorView(
            message: err is ApiException ? err.message : null,
            onRetry: () => ref.invalidate(propertyDetailProvider(propertyId)),
          ),
        ),
        data: (result) {
          final (property, similar) = result;
          final isFavorite = ref.watch(favoritesControllerProvider).contains(property.id);

          return CustomScrollView(
            slivers: [
              SliverAppBar(
                pinned: true,
                expandedHeight: 300,
                backgroundColor: AppColors.surface,
                foregroundColor: AppColors.onSurface,
                actions: [
                  IconButton(
                    icon: Icon(isFavorite ? Icons.favorite : Icons.favorite_border, color: isFavorite ? AppColors.tertiaryContainer : null),
                    onPressed: () => ref.read(favoritesControllerProvider.notifier).toggle(property.id),
                  ),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: Hero(
                    tag: heroTag ?? 'property-image-${property.id}',
                    child: property.images.isEmpty
                        ? Container(color: AppColors.surfaceVariant)
                        : PageView.builder(
                            itemCount: property.images.length,
                            itemBuilder: (context, i) => CachedNetworkImage(
                              imageUrl: property.images[i],
                              fit: BoxFit.cover,
                              placeholder: (context, url) => Container(color: AppColors.surfaceVariant),
                            ),
                          ),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(property.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                          ),
                          if (property.isFeatured)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(color: AppColors.secondary, borderRadius: BorderRadius.circular(20)),
                              child: Text('property.featured'.tr(), style: const TextStyle(color: Colors.white, fontSize: 11)),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.location_on_outlined, size: 16, color: AppColors.onSurfaceVariant),
                          const SizedBox(width: 4),
                          Expanded(child: Text(property.location, style: const TextStyle(color: AppColors.onSurfaceVariant))),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(property.priceLabel('MT '), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.primary)),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          _Stat(icon: Icons.bed_outlined, label: '${property.bedrooms}'),
                          const SizedBox(width: 20),
                          _Stat(icon: Icons.bathtub_outlined, label: '${property.bathrooms}'),
                          const SizedBox(width: 20),
                          _Stat(icon: Icons.square_foot, label: '${property.area.toInt()}m²'),
                        ],
                      ),
                      const Divider(height: 32),
                      Text('property.aboutThisPlace'.tr(), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text(property.description, style: const TextStyle(height: 1.5)),
                      if (property.amenities.isNotEmpty) ...[
                        const Divider(height: 32),
                        Text('property.amenities'.tr(), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: property.amenities.map((a) => Chip(label: Text(a))).toList(),
                        ),
                      ],
                      if (property.address != null) ...[
                        const Divider(height: 32),
                        OutlinedButton.icon(
                          icon: const Icon(Icons.map_outlined),
                          label: Text('property.openInMaps'.tr()),
                          onPressed: () => launchUrl(
                            Uri.parse('https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(property.address ?? property.location)}'),
                            mode: LaunchMode.externalApplication,
                          ),
                        ),
                      ],
                      if (property.host != null) ...[
                        const Divider(height: 32),
                        Text('property.listedBy'.tr(), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          onTap: () => context.push('/agent/${property.host!.id}'),
                          leading: CircleAvatar(
                            backgroundColor: AppColors.surfaceVariant,
                            backgroundImage: property.host!.avatar != null ? CachedNetworkImageProvider(property.host!.avatar!) : null,
                            child: property.host!.avatar == null ? Text(property.host!.initials) : null,
                          ),
                          title: Text(property.host!.name),
                          subtitle: Text(property.host!.title),
                          trailing: const Icon(Icons.chevron_right),
                        ),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            icon: const Icon(Icons.mail_outline),
                            label: Text('property.contactAgent'.tr()),
                            onPressed: () => context.push('/contact', extra: {
                              'propertyId': property.id,
                              'agentId': property.hostId,
                              'subject': 'Inquiry about ${property.title}',
                            }),
                          ),
                        ),
                      ],
                      if (similar.isNotEmpty) ...[
                        const Divider(height: 32),
                        Text('property.similarProperties'.tr(), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 12),
                        SizedBox(
                          height: 266,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: similar.length,
                            separatorBuilder: (_, __) => const SizedBox(width: 12),
                            itemBuilder: (context, i) => PropertyCard(property: similar[i]),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final IconData icon;
  final String label;
  const _Stat({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.onSurfaceVariant),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
      ],
    );
  }
}
