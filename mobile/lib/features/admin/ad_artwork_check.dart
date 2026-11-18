import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../widgets/ad_banner.dart';

/// Under the ad form's picture/video field: the rules for good artwork, and
/// what the pasted link will actually look like — so whoever creates the ad
/// knows before saving whether it shows as a full banner or a small logo.
class AdArtworkCheck extends StatefulWidget {
  final String url;
  const AdArtworkCheck({super.key, required this.url});

  @override
  State<AdArtworkCheck> createState() => _AdArtworkCheckState();
}

enum _Result { empty, checking, banner, logo, video, broken }

class _AdArtworkCheckState extends State<AdArtworkCheck> {
  _Result _result = _Result.empty;
  Size? _size;
  Timer? _debounce;
  ImageStream? _stream;
  ImageStreamListener? _listener;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _check());
  }

  @override
  void didUpdateWidget(covariant AdArtworkCheck old) {
    super.didUpdateWidget(old);
    if (old.url != widget.url) {
      _debounce?.cancel();
      _debounce = Timer(const Duration(milliseconds: 600), _check);
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _detach();
    super.dispose();
  }

  void _detach() {
    if (_listener != null) _stream?.removeListener(_listener!);
    _stream = null;
    _listener = null;
  }

  void _check() {
    if (!mounted) return;
    _detach();
    final url = widget.url.trim();
    if (url.isEmpty) return setState(() => _result = _Result.empty);
    if (isVideoUrl(url)) return setState(() => _result = _Result.video);
    if (!url.startsWith('https://')) return setState(() => _result = _Result.broken);
    setState(() => _result = _Result.checking);
    _listener = ImageStreamListener(
      (info, _) {
        if (!mounted) return;
        final size = Size(info.image.width.toDouble(), info.image.height.toDouble());
        setState(() {
          _size = size;
          _result = classifyArtwork(info.image.width, info.image.height) == AdArtwork.banner
              ? _Result.banner
              : _Result.logo;
        });
      },
      onError: (_, __) {
        if (mounted) setState(() => _result = _Result.broken);
      },
    );
    _stream = CachedNetworkImageProvider(url).resolve(createLocalImageConfiguration(context))..addListener(_listener!);
  }

  @override
  Widget build(BuildContext context) {
    final w = _size?.width.round() ?? 0;
    final h = _size?.height.round() ?? 0;
    final (IconData icon, Color color, String text)? verdict = switch (_result) {
      _Result.empty => null,
      _Result.checking => (Icons.hourglass_top, AppColors.onSurfaceVariant, 'admin.artCheck.checking'.tr()),
      _Result.banner => (Icons.check_circle, const Color(0xFF166534), 'admin.artCheck.banner'.tr(args: ['$w', '$h'])),
      _Result.logo => (Icons.info_outline, AppColors.secondary, 'admin.artCheck.logo'.tr(args: ['$w', '$h'])),
      _Result.video => (Icons.smart_display_outlined, const Color(0xFF166534), 'admin.artCheck.video'.tr()),
      _Result.broken => (Icons.error_outline, AppColors.error, 'admin.artCheck.broken'.tr()),
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (verdict != null)
          Container(
            margin: const EdgeInsets.only(top: 8),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: verdict.$2.withValues(alpha: 0.07),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: verdict.$2.withValues(alpha: 0.25)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(verdict.$1, size: 18, color: verdict.$2),
                const SizedBox(width: 8),
                Expanded(child: Text(verdict.$3, style: TextStyle(fontSize: 12.5, color: verdict.$2, height: 1.35))),
              ],
            ),
          ),
        Container(
          margin: const EdgeInsets.only(top: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(10)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('admin.artRules.title'.tr(), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              const SizedBox(height: 6),
              for (final key in ['banner', 'logo', 'video', 'text'])
                Padding(
                  padding: const EdgeInsets.only(top: 3),
                  child: Text('•  ${'admin.artRules.$key'.tr()}',
                      style: const TextStyle(fontSize: 12.5, color: AppColors.onSurfaceVariant, height: 1.35)),
                ),
            ],
          ),
        ),
      ],
    );
  }
}
