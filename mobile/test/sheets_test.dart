// Forms shown as sheets must always have a way out a person can see: a close
// button, and tapping the dimmed area above the sheet.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/features/contact/contact_screen.dart';
import 'package:mobile/widgets/error_view.dart';
import 'package:mobile/widgets/sheets.dart';

Future<void> _pump(WidgetTester tester, Widget child) async {
  tester.view.physicalSize = const Size(360 * 3, 740 * 3);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(ProviderScope(
    child: MaterialApp(
      theme: AppTheme.light,
      home: MediaQuery(
        data: const MediaQueryData(size: Size(360, 740), textScaler: TextScaler.linear(1.2)),
        child: child,
      ),
    ),
  ));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('route sheet: tapping above the sheet closes it', (tester) async {
    var closed = 0;
    await _pump(
      tester,
      RouteSheet(
        onClose: () => closed++,
        builder: (context, controller) => ListView(controller: controller, children: const [Text('form')]),
      ),
    );
    await tester.tapAt(const Offset(180, 20)); // the dimmed strip at the top
    expect(closed, 1);
    await tester.tap(find.text('form')); // tapping the form itself does not
    expect(closed, 1);
  });

  testWidgets('route sheet: dragging it down closes it', (tester) async {
    var closed = 0;
    await _pump(
      tester,
      RouteSheet(
        onClose: () => closed++,
        builder: (context, controller) => ListView(controller: controller, children: const [SizedBox(height: 60, child: Text('form'))]),
      ),
    );
    await tester.drag(find.text('form'), const Offset(0, 600));
    await tester.pumpAndSettle(const Duration(seconds: 1));
    expect(closed, 1);
  });

  testWidgets('sheet title has a close button', (tester) async {
    var closed = 0;
    await _pump(tester, Scaffold(body: SheetTitle('A long title that needs to wrap onto a second line', onClose: () => closed++)));
    await tester.tap(find.byIcon(Icons.close));
    expect(closed, 1);
  });

  testWidgets('contact form: close button, and errors that say what is wrong', (tester) async {
    await _pump(tester, const ContactScreen());
    expect(find.byIcon(Icons.close), findsOneWidget);
    await tester.ensureVisible(find.text('common.send'));
    await tester.tap(find.text('common.send'));
    await tester.pumpAndSettle();
    expect(find.text('common.required'), findsNWidgets(3)); // name, subject, message
    expect(find.text('admin.validEmail'), findsOneWidget);
  });

  testWidgets('an empty list can still be pulled to refresh', (tester) async {
    var refreshed = 0;
    await _pump(
      tester,
      Scaffold(
        body: RefreshIndicator(
          onRefresh: () async => refreshed++,
          child: const EmptyView(icon: Icons.inbox_outlined, title: 'Nothing here'),
        ),
      ),
    );
    await tester.drag(find.text('Nothing here'), const Offset(0, 300));
    await tester.pumpAndSettle();
    expect(refreshed, 1);
  });
}
