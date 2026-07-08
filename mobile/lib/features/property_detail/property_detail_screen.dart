import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../controllers/favorites_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_config.dart';
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

/// The listing form folds agent contact details and coordinates into the
/// description text (see listing_form_screen.dart / the website's
/// post-property page). Pull them back out so they can be shown as tappable
/// actions instead of raw text.
class _ParsedDetails {
  final String description;
  final String? agentPhone;
  final String? whatsapp;
  final String? contactEmail;
  final String? responseTime;
  final String? coordinates;

  const _ParsedDetails({
    required this.description,
    this.agentPhone,
    this.whatsapp,
    this.contactEmail,
    this.responseTime,
    this.coordinates,
  });

  factory _ParsedDetails.parse(String raw) {
    String? phone, whatsapp, email, responseTime, coordinates;
    final kept = <String>[];
    for (final line in raw.split('\n')) {
      final t = line.trim();
      String? value(String prefix) =>
          t.toLowerCase().startsWith(prefix.toLowerCase()) ? t.substring(prefix.length).trim() : null;

      final v = value('Agent phone:') ??
          value('WhatsApp:') ??
          value('Contact email:') ??
          value('Preferred response time:') ??
          value('Coordinates:');
      if (v == null) {
        kept.add(line);
        continue;
      }
      if (t.toLowerCase().startsWith('agent phone:')) phone = v;
      if (t.toLowerCase().startsWith('whatsapp:')) whatsapp = v;
      if (t.toLowerCase().startsWith('contact email:')) email = v;
      if (t.toLowerCase().startsWith('preferred response time:')) responseTime = v;
      if (t.toLowerCase().startsWith('coordinates:')) coordinates = v;
    }
    final cleaned = kept.join('\n').replaceAll(RegExp(r'\n{3,}'), '\n\n').trim();
    return _ParsedDetails(
      description: cleaned,
      agentPhone: phone,
      whatsapp: whatsapp,
      contactEmail: email,
      responseTime: responseTime,
      coordinates: coordinates,
    );
  }
}

/// Mozambican numbers are usually written without the country code; wa.me
/// only accepts full international numbers.
String _internationalDigits(String raw) {
  var digits = raw.replaceAll(RegExp(r'[^0-9]'), '');
  if (digits.startsWith('00')) digits = digits.substring(2);
  if (digits.length == 9 && digits.startsWith('8')) digits = '258$digits';
  return digits;
}

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

class _PropertyDetailBody extends ConsumerStatefulWidget {
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

  @override
  ConsumerState<_PropertyDetailBody> createState() => _PropertyDetailBodyState();
}

class _PropertyDetailBodyState extends ConsumerState<_PropertyDetailBody> {
  final _pageController = PageController();
  int _currentImage = 0;
  late final _ParsedDetails _details = _ParsedDetails.parse(widget.property.description);

  Property get property => widget.property;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _openContact() {
    context.push('/contact', extra: {
      'propertyId': property.id,
      'agentId': property.hostId,
      'subject': 'Inquiry about ${property.title}',
    });
  }

  String get _propertyUrl => '${ApiConfig.rootUrl}/property/${property.id}';

  Future<void> _launch(Uri uri) async {
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('common.somethingWentWrong'.tr())));
      }
    }
  }

  void _call(String number) => _launch(Uri.parse('tel:$number'));

  void _openWhatsApp(String number) {
    final digits = _internationalDigits(number);
    final message = 'property.whatsappMessage'.tr(args: [property.title, _propertyUrl]);
    _launch(Uri.parse('https://wa.me/$digits?text=${Uri.encodeComponent(message)}'));
  }

  void _email(String address) {
    final subject = Uri.encodeComponent('Inquiry about ${property.title}');
    final body = Uri.encodeComponent('Hello,\n\nI am interested in "${property.title}" ($_propertyUrl).\n');
    _launch(Uri.parse('mailto:$address?subject=$subject&body=$body'));
  }

  void _openMaps() {
    final query = _details.coordinates ?? property.address ?? property.location;
    _launch(Uri.parse('https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(query)}'));
  }

  void _openFullscreenGallery(int initialIndex) {
    if (property.images.isEmpty) return;
    Navigator.of(context).push(MaterialPageRoute(
      fullscreenDialog: true,
      builder: (_) => _FullscreenGallery(images: property.images, initialIndex: initialIndex),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final images = property.images;
    // Tappable contact channels, deduplicated against the host record.
    final phone = _details.agentPhone ?? property.host?.phone;
    final whatsapp = _details.whatsapp;
    final email = _details.contactEmail ?? property.host?.email;

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
                  isFavorite: widget.isFavorite,
                  onTap: () => ref.read(favoritesControllerProvider.notifier).toggle(property.id),
                ),
              ],
              flexibleSpace: FlexibleSpaceBar(
                background: Hero(
                  tag: widget.heroTag ?? 'property-image-${property.id}',
                  child: images.isEmpty
                      ? Container(color: AppColors.surfaceVariant)
                      : Stack(
                          fit: StackFit.expand,
                          children: [
                            PageView.builder(
                              controller: _pageController,
                              itemCount: images.length,
                              onPageChanged: (i) => setState(() => _currentImage = i),
                              itemBuilder: (context, i) => GestureDetector(
                                onTap: () => _openFullscreenGallery(i),
                                child: CachedNetworkImage(
                                  imageUrl: images[i],
                                  fit: BoxFit.cover,
                                  placeholder: (context, url) => Container(color: AppColors.surfaceVariant),
                                ),
                              ),
                            ),
                            if (images.length > 1)
                              Positioned(
                                right: 12,
                                bottom: 12,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withValues(alpha: 0.55),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.photo_library_outlined, size: 14, color: Colors.white),
                                      const SizedBox(width: 5),
                                      Text('${_currentImage + 1}/${images.length}',
                                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                                    ],
                                  ),
                                ),
                              ),
                          ],
                        ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                // Extra bottom padding keeps content clear of the sticky contact bar.
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 110),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // All photos, one tap away — thumbnails sync with the pager.
                    if (images.length > 1) ...[
                      SizedBox(
                        height: 58,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: images.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (context, i) => GestureDetector(
                            onTap: () {
                              _pageController.animateToPage(i,
                                  duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: i == _currentImage ? AppColors.primary : Colors.transparent,
                                  width: 2,
                                ),
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: CachedNetworkImage(imageUrl: images[i], width: 72, height: 54, fit: BoxFit.cover),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
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
                    Text(_details.description.isEmpty ? property.description : _details.description,
                        style: const TextStyle(height: 1.5)),
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
                    if (property.address != null || _details.coordinates != null) ...[
                      const Divider(height: 32),
                      OutlinedButton.icon(
                        icon: const Icon(Icons.map_outlined),
                        label: Text('property.openInMaps'.tr()),
                        onPressed: _openMaps,
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
                    if (phone != null || whatsapp != null || email != null) ...[
                      const Divider(height: 32),
                      Text('property.contactAgent'.tr(), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          if (phone != null && phone.isNotEmpty)
                            Expanded(
                              child: _ContactActionButton(
                                icon: Icons.call_outlined,
                                label: 'property.call'.tr(),
                                color: AppColors.primary,
                                onTap: () => _call(phone),
                              ),
                            ),
                          if (whatsapp != null && whatsapp.isNotEmpty) ...[
                            if (phone != null && phone.isNotEmpty) const SizedBox(width: 10),
                            Expanded(
                              child: _ContactActionButton(
                                icon: Icons.chat_outlined,
                                label: 'WhatsApp',
                                color: const Color(0xFF1FAF38),
                                onTap: () => _openWhatsApp(whatsapp),
                              ),
                            ),
                          ],
                          if (email != null && email.isNotEmpty) ...[
                            if ((phone != null && phone.isNotEmpty) || (whatsapp != null && whatsapp.isNotEmpty))
                              const SizedBox(width: 10),
                            Expanded(
                              child: _ContactActionButton(
                                icon: Icons.mail_outline,
                                label: 'property.email'.tr(),
                                color: AppColors.secondary,
                                onTap: () => _email(email),
                              ),
                            ),
                          ],
                        ],
                      ),
                      if (_details.responseTime != null && _details.responseTime!.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            const Icon(Icons.schedule_outlined, size: 15, color: AppColors.onSurfaceVariant),
                            const SizedBox(width: 6),
                            Text(
                              '${'property.responseTime'.tr()}: ${_details.responseTime}',
                              style: const TextStyle(fontSize: 12.5, color: AppColors.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ],
                    ],
                    if (widget.similar.isNotEmpty) ...[
                      const Divider(height: 32),
                      Text('property.similarProperties'.tr(), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 266,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: widget.similar.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 12),
                          itemBuilder: (context, i) => PropertyCard(property: widget.similar[i]),
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
            onCall: phone != null && phone.isNotEmpty ? () => _call(phone) : null,
            onWhatsApp: whatsapp != null && whatsapp.isNotEmpty ? () => _openWhatsApp(whatsapp) : null,
            onContact: _openContact,
          ),
        ),
      ],
    );
  }
}

/// Fullscreen swipeable, zoomable viewer for every photo of the listing.
class _FullscreenGallery extends StatefulWidget {
  final List<String> images;
  final int initialIndex;
  const _FullscreenGallery({required this.images, required this.initialIndex});

  @override
  State<_FullscreenGallery> createState() => _FullscreenGalleryState();
}

class _FullscreenGalleryState extends State<_FullscreenGallery> {
  late final PageController _controller = PageController(initialPage: widget.initialIndex);
  late int _current = widget.initialIndex;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: Text('${_current + 1}/${widget.images.length}', style: const TextStyle(fontSize: 15)),
        centerTitle: true,
      ),
      body: PageView.builder(
        controller: _controller,
        itemCount: widget.images.length,
        onPageChanged: (i) => setState(() => _current = i),
        itemBuilder: (context, i) => InteractiveViewer(
          minScale: 1,
          maxScale: 4,
          child: Center(
            child: CachedNetworkImage(
              imageUrl: widget.images[i],
              fit: BoxFit.contain,
              placeholder: (context, url) => const Center(child: CircularProgressIndicator(color: Colors.white)),
            ),
          ),
        ),
      ),
    );
  }
}

class _ContactActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _ContactActionButton({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withValues(alpha: 0.35)),
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(height: 4),
              Text(label, style: TextStyle(color: color, fontSize: 11.5, fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ),
    );
  }
}

class _StickyContactBar extends StatelessWidget {
  final Property property;
  final VoidCallback? onCall;
  final VoidCallback? onWhatsApp;
  final VoidCallback onContact;
  const _StickyContactBar({
    required this.property,
    required this.onCall,
    required this.onWhatsApp,
    required this.onContact,
  });

  @override
  Widget build(BuildContext context) {
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
            if (onCall != null) ...[
              _PressableIconButton(icon: Icons.call_outlined, color: AppColors.primary, onTap: onCall!),
              const SizedBox(width: 10),
            ],
            if (onWhatsApp != null) ...[
              _PressableIconButton(icon: Icons.chat_outlined, color: const Color(0xFF1FAF38), onTap: onWhatsApp!),
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
  final Color color;
  final VoidCallback onTap;
  const _PressableIconButton({required this.icon, required this.color, required this.onTap});

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
            color: widget.color.withValues(alpha: 0.1),
            shape: BoxShape.circle,
            border: Border.all(color: widget.color.withValues(alpha: 0.35)),
          ),
          child: Icon(widget.icon, color: widget.color),
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
