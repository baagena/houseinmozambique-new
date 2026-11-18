// Ad artwork rules: only wide, large pictures become full-width banners;
// logos, square/small pictures and small GIFs stay a small tile.

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/models/ad.dart';
import 'package:mobile/widgets/ad_banner.dart';

/// Redraws its child every second, like the Home screen does.
class _Redrawing extends StatefulWidget {
  final Widget Function() build;
  const _Redrawing(this.build);
  @override
  State<_Redrawing> createState() => _RedrawingState();
}

class _RedrawingState extends State<_Redrawing> {
  late final Timer _t = Timer.periodic(const Duration(seconds: 1), (_) => setState(() {}));
  @override
  void dispose() {
    _t.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.build();
}

void main() {
  test('wide, large pictures are banners', () {
    expect(classifyArtwork(1200, 400), AdArtwork.banner); // 3:1 — the recommended size
    expect(classifyArtwork(1600, 900), AdArtwork.banner); // 16:9
    expect(classifyArtwork(900, 600), AdArtwork.banner); // 3:2, the minimum shape
  });

  test('logos, square, tall and small pictures stay small', () {
    expect(classifyArtwork(400, 400), AdArtwork.logo); // square logo
    expect(classifyArtwork(1080, 1350), AdArtwork.logo); // portrait poster
    expect(classifyArtwork(300, 100), AdArtwork.logo); // small GIF, wide but tiny
    expect(classifyArtwork(1000, 800), AdArtwork.logo); // not wide enough
    expect(classifyArtwork(0, 0), AdArtwork.logo); // unknown
  });

  test('video links are recognised', () {
    expect(isVideoUrl('https://res.cloudinary.com/demo/video/upload/w_640/sea_turtle.mp4'), isTrue);
    expect(isVideoUrl('https://example.com/clip.MP4?x=1'), isTrue);
    expect(isVideoUrl('https://example.com/banner.gif'), isFalse);
    expect(isVideoUrl(null), isFalse);
  });

  testWidgets('rotation moves on even while the screen keeps redrawing', (tester) async {
    Ad ad(String id) => Ad(id: id, title: 'Ad $id', position: 'top_banner');
    await tester.pumpWidget(ProviderScope(
      child: MaterialApp(
        theme: AppTheme.light,
        home: Scaffold(
          body: _Redrawing(() => AdBanner(ads: [ad('one'), ad('two')], position: 'top_banner')),
        ),
      ),
    ));
    expect(find.text('Ad one'), findsOneWidget);
    for (var i = 0; i < 9; i++) {
      await tester.pump(const Duration(seconds: 1));
    }
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
    expect(find.text('Ad two'), findsOneWidget);
    expect(find.text('Ad one'), findsNothing);
    await tester.pumpWidget(const SizedBox()); // stop the timers
  });
}
