// Basic smoke test: the app should build its first frame (splash screen)
// without throwing, with localization and Riverpod correctly wired up.

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/main.dart';

void main() {
  testWidgets('App builds its first frame', (WidgetTester tester) async {
    await EasyLocalization.ensureInitialized();

    await tester.pumpWidget(
      EasyLocalization(
        supportedLocales: const [Locale('en'), Locale('pt')],
        path: 'assets/translations',
        fallbackLocale: const Locale('en'),
        child: const ProviderScope(child: HouseInMozambiqueApp()),
      ),
    );
    await tester.pump();

    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
