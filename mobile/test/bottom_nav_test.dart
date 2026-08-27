// Regression test for the bottom nav: five items — including the centre
// post-a-house action — must fit a narrow phone at the largest font size the
// app allows, without a label wrapping onto a clipped second line.
//
// No EasyLocalization here on purpose: initializing it hangs under
// `flutter test` (see widget_test.dart), and untranslated keys ('nav.explore')
// are longer than the real labels, so this is the stricter layout check.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:mobile/widgets/app_shell.dart';

GoRouter _router() => GoRouter(
      initialLocation: '/home',
      routes: [
        StatefulShellRoute.indexedStack(
          builder: (context, state, shell) => AppShell(navigationShell: shell),
          branches: [
            for (final path in ['/home', '/explore', '/agents', '/profile', '/my-listings', '/my-leads'])
              StatefulShellBranch(routes: [
                GoRoute(path: path, builder: (context, state) => const SizedBox.shrink()),
              ]),
          ],
        ),
      ],
    );

void main() {
  testWidgets('Bottom nav fits a 320dp phone at max text scale', (tester) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp.router(
          // A user asking for huge text, then main.dart's clamp on top of it.
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(context).copyWith(textScaler: const TextScaler.linear(2)),
            child: MediaQuery.withClampedTextScaling(
              maxScaleFactor: 1.2,
              child: child ?? const SizedBox.shrink(),
            ),
          ),
          routerConfig: _router(),
        ),
      ),
    );
    // Not pumpAndSettle: the shell's entry animations keep scheduling frames.
    await tester.pump(const Duration(seconds: 1));

    for (final key in ['nav.home', 'nav.explore', 'nav.post', 'nav.agents', 'nav.profile']) {
      final text = tester.widget<Text>(find.text(key));
      expect(text.maxLines, 1, reason: '$key should never wrap');
    }
    expect(tester.takeException(), isNull);
  });
}
