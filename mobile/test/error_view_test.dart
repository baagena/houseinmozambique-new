// A page that failed to load must come back by itself when the connection
// does — nobody should have to find "Try again".

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/widgets/error_view.dart';

Widget _host(Widget child) => MaterialApp(home: Scaffold(body: child));

void main() {
  testWidgets('retries by itself after a few seconds', (tester) async {
    var retries = 0;
    await tester.pumpWidget(_host(ErrorView(message: 'offline', onRetry: () => retries++)));
    expect(find.text('common.retryingAutomatically'), findsOneWidget);
    await tester.pump(const Duration(seconds: 3));
    expect(retries, 0);
    await tester.pump(const Duration(seconds: 2));
    expect(retries, 1);
  });

  testWidgets('backs off while failures repeat', (tester) async {
    var retries = 0;
    // Each failed retry shows a fresh ErrorView, as a real screen does.
    for (var i = 0; i < 3; i++) {
      await tester.pumpWidget(_host(ErrorView(key: ValueKey(i), message: 'offline', onRetry: () => retries++)));
    }
    final before = retries;
    await tester.pump(const Duration(seconds: 5));
    expect(retries, before, reason: 'third failure in a row waits longer than 5 s');
    await tester.pump(const Duration(seconds: 30));
    expect(retries, before + 1);
  });

  testWidgets('retries at once when the app comes back to the front', (tester) async {
    var retries = 0;
    await tester.pumpWidget(_host(ErrorView(message: 'offline', onRetry: () => retries++)));
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.paused);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
    await tester.pump();
    expect(retries, 1);
  });

  testWidgets('the button still works, and auto-retry can be turned off', (tester) async {
    var retries = 0;
    await tester.pumpWidget(_host(ErrorView(message: 'x', autoRetry: false, onRetry: () => retries++)));
    expect(find.text('common.retryingAutomatically'), findsNothing);
    await tester.pump(const Duration(minutes: 2));
    expect(retries, 0);
    await tester.tap(find.text('common.retry'));
    expect(retries, 1);
  });
}
