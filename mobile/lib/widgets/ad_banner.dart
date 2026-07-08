import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/network/api_client.dart';
import '../core/network/api_config.dart';
import '../core/theme/app_theme.dart';
import '../models/ad.dart';

/// Renders the active ads for one placement slot (mirrors the website's
/// AdBanner). Multiple ads in the same slot auto-rotate every 5 seconds so
/// every advertiser gets seen.
class AdBanner extends ConsumerStatefulWidget {
  final List<Ad> ads;
  final String position;
  const AdBanner({super.key, required this.ads, required this.position});

  @override
  ConsumerState<AdBanner> createState() => _AdBannerState();
}

class _AdBannerState extends ConsumerState<AdBanner> {
  late List<Ad> _slotAds;
  int _index = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _slotAds = widget.ads.where((a) => a.position == widget.position).toList();
    _startRotation();
  }

  @override
  void didUpdateWidget(covariant AdBanner oldWidget) {
    super.didUpdateWidget(oldWidget);
    _slotAds = widget.ads.where((a) => a.position == widget.position).toList();
    if (_index >= _slotAds.length) _index = 0;
    _startRotation();
  }

  void _startRotation() {
    _timer?.cancel();
    if (_slotAds.length > 1) {
      _timer = Timer.periodic(const Duration(seconds: 5), (_) {
        if (mounted) setState(() => _index = (_index + 1) % _slotAds.length);
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _open(Ad ad) async {
    // Fire-and-forget click tracking; shared with the website's counter.
    ref
        .read(apiClientProvider)
        .dio
        .post('${ApiConfig.rootUrl}/api/admin/ads/${ad.id}/click')
        .ignore();
    final url = ad.linkUrl;
    if (url == null || url.isEmpty) return;
    final uri = Uri.tryParse(url);
    if (uri != null) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_slotAds.isEmpty) return const SizedBox.shrink();
    final ad = _slotAds[_index];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        children: [
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 400),
            child: _AdCard(key: ValueKey(ad.id), ad: ad, onTap: () => _open(ad)),
          ),
          if (_slotAds.length > 1) ...[
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_slotAds.length, (i) {
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: i == _index ? 16 : 6,
                  height: 6,
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  decoration: BoxDecoration(
                    color: i == _index ? AppColors.primary : AppColors.outlineVariant,
                    borderRadius: BorderRadius.circular(3),
                  ),
                );
              }),
            ),
          ],
        ],
      ),
    );
  }
}

class _AdCard extends StatelessWidget {
  final Ad ad;
  final VoidCallback onTap;
  const _AdCard({super.key, required this.ad, required this.onTap});

  static Color _hex(String? value, Color fallback) {
    if (value == null || value.isEmpty) return fallback;
    var s = value.replaceFirst('#', '');
    if (s.length == 3) s = s.split('').map((c) => '$c$c').join();
    final n = int.tryParse(s, radix: 16);
    if (n == null || s.length != 6) return fallback;
    return Color(0xFF000000 | n);
  }

  @override
  Widget build(BuildContext context) {
    final bg = _hex(ad.bgColor, AppColors.primary);
    final text = _hex(ad.textColor, Colors.white);
    final accent = _hex(ad.accentColor, AppColors.secondaryContainer);
    final hasLink = ad.linkUrl != null && ad.linkUrl!.isNotEmpty;

    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: hasLink ? onTap : null,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              if (ad.imageUrl != null && ad.imageUrl!.isNotEmpty) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: CachedNetworkImage(
                    imageUrl: ad.imageUrl!,
                    width: 52,
                    height: 52,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => const SizedBox.shrink(),
                  ),
                ),
                const SizedBox(width: 12),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'ads.sponsored'.tr().toUpperCase(),
                      style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: text.withValues(alpha: 0.65)),
                    ),
                    const SizedBox(height: 2),
                    Text(ad.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: text, fontWeight: FontWeight.w700, fontSize: 14.5)),
                    if (ad.description != null && ad.description!.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(ad.description!, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: text.withValues(alpha: 0.75), fontSize: 12)),
                    ],
                  ],
                ),
              ),
              if (hasLink) ...[
                const SizedBox(width: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(color: accent, borderRadius: BorderRadius.circular(10)),
                  child: Text(
                    ad.linkText ?? 'ads.learnMore'.tr(),
                    style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: Color(0xFF1A1A1A)),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
