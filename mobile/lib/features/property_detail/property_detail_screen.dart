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
import '../../widgets/favorites_fab.dart';
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
            message: err.asApiException?.message,
            onRetry: () => ref.invalidate(propertyDetailProvider(propertyId)),
          ),
        ),
        data: (result) {
          final (property, similar) = result;
          final isFavorite = ref.watch(favoritesControllerProvider).contains(property.id);

          return _PropertyDetailBody(
            property: property,
            similar: similar,
            isFavorite: isFavorite,
            heroTag: heroTag,
          );
        },
      ),
    );
  }
}

class _PropertyDetailBody extends ConsumerWidget {
  final Property property;
  final List<Property> similar;
  final bool isFavorite;
  final String? heroTag;

  const _PropertyDetailBody({
    required this.property,
    required this.similar,
    required this.isFavorite,
    required this.heroTag,
  });

  void _openContact(BuildContext context) {
    context.push('/contact', extra: {
      'propertyId': property.id,
      'agentId': property.hostId,
      'subject': 'Inquiry about ${property.title}',
    });
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Stack(
      children: [
        CustomScrollView(
          slivers: [
            SliverAppBar(
              pinned: true,
              expandedHeight: 300,
              backgroundColor: AppColors.surface,
              foregroundColor: AppColors.onSurface,
              actions: [
                _AnimatedFavoriteButton(
                  isFavorite: isFavorite,
                  onTap: () => ref.read(favoritesControllerProvider.notifier).toggle(property.id),
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
                // Extra bottom padding keeps content clear of the sticky contact bar.
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 110),
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
        ),
        // Shortcut to the saved-properties list — separate from the per-item
        // toggle up in the app bar, so it sits above the sticky contact bar.
        Positioned(
          right: 16,
          bottom: 100,
          child: FavoritesFab(heroTag: 'detail-favorites-fab-${property.id}'),
        ),
        // Sticky bottom contact/booking bar — always reachable without scrolling.
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: _StickyContactBar(
            property: property,
            onContact: () => _openContact(context),
          ),
        ),
      ],
    );
  }
}

class _StickyContactBar extends StatelessWidget {
  final Property property;
  final VoidCallback onContact;
  const _StickyContactBar({required this.property, required this.onContact});

  @override
  Widget build(BuildContext context) {
    final phone = property.host?.phone;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
      builder: (context, value, child) => Transform.translate(
        offset: Offset(0, (1 - value) * 40),
        child: Opacity(opacity: value, child: child),
      ),
      child: Container(
        padding: EdgeInsets.fromLTRB(20, 12, 20, 12 + MediaQuery.of(context).padding.bottom),
        decoration: BoxDecoration(
          color: AppColors.surface,
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 16, offset: const Offset(0, -4))],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(property.priceLabel('MT '), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary)),
                  Text('property.listedBy'.tr(), style: const TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant)),
                ],
              ),
            ),
            if (phone != null && phone.isNotEmpty) ...[
              _PressableIconButton(
                icon: Icons.call_outlined,
                onTap: () => launchUrl(Uri.parse('tel:$phone')),
              ),
              const SizedBox(width: 10),
            ],
            Expanded(
              flex: 2,
              child: _PressableButton(
                label: 'property.contactAgent'.tr(),
                icon: Icons.mail_outline,
                onTap: onContact,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PressableButton extends StatefulWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  const _PressableButton({required this.label, required this.icon, required this.onTap});

  @override
  State<_PressableButton> createState() => _PressableButtonState();
}

class _PressableButtonState extends State<_PressableButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _pressed ? 0.96 : 1,
        duration: const Duration(milliseconds: 100),
        child: SizedBox(
          height: 48,
          child: ElevatedButton.icon(
            icon: Icon(widget.icon, size: 18),
            label: Text(widget.label),
            onPressed: widget.onTap,
          ),
        ),
      ),
    );
  }
}

class _PressableIconButton extends StatefulWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _PressableIconButton({required this.icon, required this.onTap});

  @override
  State<_PressableIconButton> createState() => _PressableIconButtonState();
}

class _PressableIconButtonState extends State<_PressableIconButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _pressed ? 0.9 : 1,
        duration: const Duration(milliseconds: 100),
        child: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: AppColors.primaryContainer.withValues(alpha: 0.12),
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
          ),
          child: Icon(widget.icon, color: AppColors.primary),
        ),
      ),
    );
  }
}

class _AnimatedFavoriteButton extends StatelessWidget {
  final bool isFavorite;
  final VoidCallback onTap;
  const _AnimatedFavoriteButton({required this.isFavorite, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: onTap,
      icon: AnimatedSwitcher(
        duration: const Duration(milliseconds: 220),
        transitionBuilder: (child, animation) => ScaleTransition(scale: animation, child: child),
        child: Icon(
          isFavorite ? Icons.favorite : Icons.favorite_border,
          key: ValueKey(isFavorite),
          color: isFavorite ? AppColors.tertiaryContainer : null,
        ),
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
