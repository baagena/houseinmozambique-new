import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:video_player/video_player.dart';

import '../core/network/api_client.dart';
import '../core/network/api_config.dart';
import '../core/theme/app_theme.dart';
import '../models/ad.dart';

/// Renders the active ads for one placement slot (mirrors the website's
/// AdBanner). Several ads in one slot rotate, fading through so two never
/// overlap; a video ad is given time to play.
///
/// Artwork (image or video) is shown whole at its own shape — never cropped
/// and never covered by text, since banners usually carry their own wording.
/// The title and button sit underneath, on a clean card.
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

  static const _imageDwell = Duration(seconds: 7);
  static const _videoDwell = Duration(seconds: 15);

  @override
  void initState() {
    super.initState();
    _slotAds = _forSlot();
    _schedule();
  }

  @override
  void didUpdateWidget(covariant AdBanner oldWidget) {
    super.didUpdateWidget(oldWidget);
    final next = _forSlot();
    // The Home screen redraws often; restarting the timer on every redraw
    // meant the rotation never reached the next ad. Only a real change of
    // this slot's ads restarts it.
    final changed = next.length != _slotAds.length ||
        [for (var i = 0; i < next.length; i++) next[i].id != _slotAds[i].id].any((d) => d);
    _slotAds = next;
    if (!changed) return;
    if (_index >= _slotAds.length) _index = 0;
    _schedule();
  }

  List<Ad> _forSlot() => widget.ads.where((a) => a.position == widget.position).toList();

  void _schedule() {
    _timer?.cancel();
    if (_slotAds.length < 2) return;
    final dwell = isVideoUrl(_slotAds[_index].imageUrl) ? _videoDwell : _imageDwell;
    _timer = Timer(dwell, () {
      if (!mounted) return;
      setState(() => _index = (_index + 1) % _slotAds.length);
      _schedule();
    });
  }

  void _goTo(int i) {
    setState(() => _index = i);
    _schedule();
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
    final uri = Uri.tryParse(url.startsWith('/') ? '${ApiConfig.rootUrl}$url' : url);
    if (uri != null) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_slotAds.isEmpty) return const SizedBox.shrink();
    final ad = _slotAds[_index];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Column(
        children: [
          AnimatedSize(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeOutCubic,
            alignment: Alignment.topCenter,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 500),
              switchInCurve: const Interval(0.5, 1, curve: Curves.easeOut),
              switchOutCurve: const Interval(0.5, 1, curve: Curves.easeIn),
              layoutBuilder: (current, previous) => Stack(
                alignment: Alignment.topCenter,
                children: [...previous, if (current != null) current],
              ),
              child: _AdCard(key: ValueKey(ad.id), ad: ad, onTap: () => _open(ad)),
            ),
          ),
          if (_slotAds.length > 1) ...[
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (var i = 0; i < _slotAds.length; i++)
                  GestureDetector(
                    onTap: () => _goTo(i),
                    behavior: HitTestBehavior.opaque,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 6),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: i == _index ? 18 : 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: i == _index ? AppColors.primary : AppColors.outlineVariant,
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

/// A link to a video file (MP4/WebM/MOV, or a Cloudinary video upload).
bool isVideoUrl(String? url) {
  if (url == null || url.isEmpty) return false;
  final path = Uri.tryParse(url)?.path.toLowerCase() ?? url.toLowerCase();
  return RegExp(r'\.(mp4|webm|mov|m4v)$').hasMatch(path) || path.contains('/video/upload/');
}

Color _hex(String? value, Color fallback) {
  if (value == null || value.isEmpty) return fallback;
  var s = value.replaceFirst('#', '');
  if (s.length == 3) s = s.split('').map((c) => '$c$c').join();
  final n = int.tryParse(s, radix: 16);
  if (n == null || s.length != 6) return fallback;
  return Color(0xFF000000 | n);
}

/// Black or white, whichever reads better on [background].
Color _onColor(Color background) =>
    background.computeLuminance() > 0.55 ? const Color(0xFF111827) : Colors.white;

/// How a picture is shown, decided from its real size — the same rules the
/// admin form explains when an ad is created.
enum AdArtwork { banner, logo }

/// A banner must be at least 3:2 wide and 600 px across.
const kBannerMinRatio = 1.5;
const kBannerMinWidth = 600;

/// Wide enough and big enough → full-width banner. Anything else (logos,
/// square or small pictures, small GIFs) → a small tile beside the title,
/// never stretched or enlarged.
AdArtwork classifyArtwork(int width, int height) {
  if (width <= 0 || height <= 0) return AdArtwork.logo;
  final ratio = width / height;
  return ratio >= kBannerMinRatio && width >= kBannerMinWidth ? AdArtwork.banner : AdArtwork.logo;
}

class _AdCard extends StatefulWidget {
  final Ad ad;
  final VoidCallback onTap;
  const _AdCard({super.key, required this.ad, required this.onTap});

  @override
  State<_AdCard> createState() => _AdCardState();
}

class _AdCardState extends State<_AdCard> {
  ImageStream? _stream;
  ImageStreamListener? _listener;
  Size? _size; // the picture's real size, once known
  bool _failed = false;

  Ad get ad => widget.ad;
  bool get _hasPicture => (ad.imageUrl ?? '').isNotEmpty && !isVideoUrl(ad.imageUrl);

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_hasPicture || _stream != null) return;
    _listener = ImageStreamListener(
      (info, _) {
        if (mounted) setState(() => _size = Size(info.image.width.toDouble(), info.image.height.toDouble()));
      },
      onError: (_, __) {
        if (mounted) setState(() => _failed = true);
      },
    );
    _stream = CachedNetworkImageProvider(ad.imageUrl!).resolve(createLocalImageConfiguration(context))
      ..addListener(_listener!);
  }

  @override
  void dispose() {
    if (_listener != null) _stream?.removeListener(_listener!);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final brand = _hex(ad.bgColor, AppColors.primary);
    final accent = _hex(ad.accentColor, AppColors.secondaryContainer);
    final hasLink = ad.linkUrl != null && ad.linkUrl!.isNotEmpty;
    final video = isVideoUrl(ad.imageUrl);
    final kind = _size == null ? null : classifyArtwork(_size!.width.round(), _size!.height.round());

    Widget? top;
    if (video) {
      top = _AdVideo(url: ad.imageUrl!);
    } else if (kind == AdArtwork.banner) {
      top = AspectRatio(
        aspectRatio: (_size!.width / _size!.height).clamp(kBannerMinRatio, 4.0),
        child: Image(image: CachedNetworkImageProvider(ad.imageUrl!), fit: BoxFit.cover, width: double.infinity),
      );
    }

    // The tile beside the title: the logo (small pictures), or the brand
    // initial for text-only ads; nothing when a banner/video already shows.
    final Widget? tile = top != null
        ? null
        : (_hasPicture && !_failed)
            ? _LogoTile(url: ad.imageUrl!, ready: _size != null)
            : _InitialTile(title: ad.title, brand: brand, accent: accent);

    return Semantics(
      label: '${'ads.sponsored'.tr()}: ${ad.title}',
      button: hasLink,
      child: Material(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(18),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: hasLink ? widget.onTap : null,
          child: Ink(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.surfaceContainerHigh),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (top != null) top,
                _AdFooter(ad: ad, brand: brand, tile: tile, hasLink: hasLink, onTap: widget.onTap),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// A small picture (logo, icon, small GIF) at no more than 64 px, kept whole
/// and never enlarged beyond its real size.
class _LogoTile extends StatelessWidget {
  final String url;
  final bool ready;
  const _LogoTile({required this.url, required this.ready});

  @override
  Widget build(BuildContext context) => Container(
        width: 64,
        height: 64,
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.surfaceContainerHigh),
        ),
        child: ready
            ? Image(image: CachedNetworkImageProvider(url), fit: BoxFit.scaleDown)
            : const Center(child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))),
      );
}

class _InitialTile extends StatelessWidget {
  final String title;
  final Color brand;
  final Color accent;
  const _InitialTile({required this.title, required this.brand, required this.accent});

  @override
  Widget build(BuildContext context) {
    final initial = title.trim().isEmpty ? '•' : title.trim().characters.first.toUpperCase();
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(color: brand, borderRadius: BorderRadius.circular(12)),
      alignment: Alignment.center,
      child: Text(initial, style: TextStyle(color: accent, fontSize: 20, fontWeight: FontWeight.w800)),
    );
  }
}

/// Title, description and button, with the optional tile on the left.
class _AdFooter extends StatelessWidget {
  final Ad ad;
  final Color brand;
  final Widget? tile;
  final bool hasLink;
  final VoidCallback onTap;
  const _AdFooter({required this.ad, required this.brand, required this.tile, required this.hasLink, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final buttonText = (ad.linkText ?? '').trim().isNotEmpty ? ad.linkText!.trim() : 'ads.learnMore'.tr();
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (tile != null) ...[tile!, const SizedBox(width: 12)],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const _SponsoredLabel(),
                    const SizedBox(height: 4),
                    Text(ad.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 15.5, fontWeight: FontWeight.w700, color: AppColors.onSurface, height: 1.25)),
                    if ((ad.description ?? '').trim().isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(ad.description!.trim(),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant, height: 1.35)),
                    ],
                  ],
                ),
              ),
            ],
          ),
          if (hasLink) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 42,
              child: FilledButton(
                onPressed: onTap,
                style: FilledButton.styleFrom(
                  backgroundColor: brand,
                  foregroundColor: _onColor(brand),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Flexible(
                      child: Text(buttonText.replaceAll(RegExp(r'\s*[→>]+\s*$'), ''),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                    ),
                    const SizedBox(width: 6),
                    const Icon(Icons.arrow_forward, size: 17),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _SponsoredLabel extends StatelessWidget {
  const _SponsoredLabel();

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLow,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: AppColors.surfaceContainerHigh),
        ),
        child: Text(
          'ads.sponsored'.tr(),
          style: const TextStyle(
              fontSize: 10.5, fontWeight: FontWeight.w600, color: AppColors.onSurfaceVariant, letterSpacing: 0.3),
        ),
      );
}

/// A video ad: plays silently on a loop at its own shape, with a sound
/// toggle. Falls back to nothing if the file can't play.
class _AdVideo extends StatefulWidget {
  final String url;
  const _AdVideo({required this.url});

  @override
  State<_AdVideo> createState() => _AdVideoState();
}

class _AdVideoState extends State<_AdVideo> {
  late final VideoPlayerController _controller = VideoPlayerController.networkUrl(
    Uri.parse(widget.url),
    videoPlayerOptions: VideoPlayerOptions(mixWithOthers: true),
  );
  bool _ready = false;
  bool _failed = false;
  bool _muted = true;

  @override
  void initState() {
    super.initState();
    _controller.initialize().then((_) async {
      if (!mounted) return;
      await _controller.setVolume(0);
      await _controller.setLooping(true);
      await _controller.play();
      if (mounted) setState(() => _ready = true);
    }).catchError((Object _) {
      if (mounted) setState(() => _failed = true);
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggleSound() {
    setState(() => _muted = !_muted);
    _controller.setVolume(_muted ? 0 : 1);
  }

  @override
  Widget build(BuildContext context) {
    if (_failed) return const SizedBox.shrink();
    // Never taller than a wide frame: portrait videos are letterboxed, not
    // allowed to take over the screen.
    final ratio = _ready ? _controller.value.aspectRatio.clamp(kBannerMinRatio, 3.2) : 16 / 9;
    return AspectRatio(
      aspectRatio: ratio,
      child: ColoredBox(
        color: Colors.black,
        child: !_ready
            ? const Center(child: SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)))
            : Stack(
                fit: StackFit.expand,
                children: [
                  FittedBox(
                    fit: BoxFit.contain,
                    child: SizedBox(
                      width: _controller.value.size.width,
                      height: _controller.value.size.height,
                      child: VideoPlayer(_controller),
                    ),
                  ),
                  Positioned(
                    right: 10,
                    bottom: 10,
                    child: Material(
                      color: Colors.black54,
                      shape: const CircleBorder(),
                      child: IconButton(
                        tooltip: _muted ? 'ads.unmute'.tr() : 'ads.mute'.tr(),
                        visualDensity: VisualDensity.compact,
                        icon: Icon(_muted ? Icons.volume_off : Icons.volume_up, color: Colors.white, size: 18),
                        onPressed: _toggleSound,
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
