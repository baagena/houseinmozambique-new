// Before posting a listing, people see only what applies to them: admins
// never meet plans or prices, an agent whose plan has room goes straight to
// the form, and only a full plan stops anyone. Shapes below are the live
// /api/dashboard/entitlement responses for the local test accounts.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/features/agent_dashboard/plan_gate.dart';

Map<String, dynamic> _ent({
  String planName = 'Free',
  int quota = 1,
  int used = 0,
  bool canPublish = true,
  bool inGrace = false,
  List<String> upgrades = const ['brokers', 'enterprise'],
}) =>
    {
      'state': {
        'planSlug': 'standard',
        'planName': planName,
        'quota': quota,
        'used': used,
        'remaining': quota < 0 ? null : quota - used,
        'credits': 0,
        'canPublish': canPublish,
        'nextSource': canPublish ? 'subscription' : 'none',
        'inGrace': inGrace,
      },
      'upgrades': [for (final u in upgrades) {'slug': u}],
    };

Future<void> _pump(WidgetTester tester, Widget child) async {
  tester.view.physicalSize = const Size(360 * 3, 740 * 3);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(MaterialApp(
    theme: AppTheme.light,
    home: MediaQuery(
      data: const MediaQueryData(size: Size(360, 740), textScaler: TextScaler.linear(1.2)),
      child: Scaffold(body: child),
    ),
  ));
  await tester.pump();
}

void main() {
  group('deciding access', () {
    test('admin: never limited, whatever the server says', () {
      final s = PlanStatus.from('ADMIN', _ent(canPublish: false, used: 9));
      expect(s.access, PlanAccess.admin);
    });

    test('free plan with room: covered, and bigger plans exist', () {
      final s = PlanStatus.from('AGENT', _ent());
      expect(s.access, PlanAccess.covered);
      expect(s.planName, 'Free');
      expect(s.canUpgrade, isTrue);
    });

    test('paid plan with room: covered', () {
      final s = PlanStatus.from('AGENT', _ent(planName: 'Brokers Subscription', quota: 40, upgrades: ['enterprise']));
      expect(s.access, PlanAccess.covered);
      expect(s.quota, 40);
    });

    test('top plan: nothing to upgrade to', () {
      final s = PlanStatus.from('AGENT', _ent(planName: 'Enterprise', quota: -1, used: 12, upgrades: []));
      expect(s.access, PlanAccess.covered);
      expect(s.canUpgrade, isFalse);
    });

    test('full plan: stopped', () {
      final s = PlanStatus.from('OWNER', _ent(used: 1, canPublish: false));
      expect(s.access, PlanAccess.full);
    });

    test('a broken response never crashes or blocks', () {
      final s = PlanStatus.from('AGENT', <String, dynamic>{});
      expect(s.access, PlanAccess.covered);
    });
  });

  group('what people see', () {
    testWidgets('admin banner: no plan, no price, no upgrade', (tester) async {
      await _pump(tester, const PlanBanner(status: PlanStatus(access: PlanAccess.admin), showUpgrade: true));
      expect(find.text('planGate.adminTitle'), findsOneWidget);
      expect(find.textContaining('planGate.seePlans'), findsNothing);
    });

    testWidgets('free plan banner offers bigger plans', (tester) async {
      await _pump(tester, PlanBanner(status: PlanStatus.from('AGENT', _ent()), showUpgrade: true));
      expect(find.text('planGate.coveredTitle'), findsOneWidget);
      expect(find.textContaining('planGate.seePlans'), findsOneWidget);
    });

    testWidgets('top plan banner does not upsell', (tester) async {
      final s = PlanStatus.from('AGENT', _ent(planName: 'Enterprise', quota: -1, upgrades: []));
      await _pump(tester, PlanBanner(status: s, showUpgrade: true));
      expect(find.textContaining('planGate.seePlans'), findsNothing);
    });

    testWidgets('full plan: upgrade and free-a-slot, never a dead end', (tester) async {
      final s = PlanStatus.from('OWNER', _ent(used: 1, canPublish: false));
      await _pump(
        tester,
        PlanGateView(scrollController: ScrollController(), status: s, onClose: () {}, showPaidOptions: true),
      );
      expect(find.text('planGate.fullTitle'), findsOneWidget);
      expect(find.text('planGate.upgrade'), findsOneWidget);
      expect(find.text('planGate.freeSlot'), findsOneWidget);
      expect(find.byIcon(Icons.close), findsOneWidget);
    });

    testWidgets('expired plan says renew, not upgrade', (tester) async {
      final s = PlanStatus.from('AGENT', _ent(used: 3, quota: 3, canPublish: false, inGrace: true));
      await _pump(
        tester,
        PlanGateView(scrollController: ScrollController(), status: s, onClose: () {}, showPaidOptions: true),
      );
      expect(find.text('planGate.renew'), findsOneWidget);
      expect(find.text('planGate.upgrade'), findsNothing);
    });

    testWidgets('where paid plans cannot be shown (iPhone), no upgrade button', (tester) async {
      final s = PlanStatus.from('OWNER', _ent(used: 1, canPublish: false));
      await _pump(
        tester,
        PlanGateView(scrollController: ScrollController(), status: s, onClose: () {}, showPaidOptions: false),
      );
      expect(find.text('planGate.upgrade'), findsNothing);
      expect(find.text('planGate.freeSlot'), findsOneWidget);
    });

    testWidgets('checking state has a way out', (tester) async {
      await _pump(
        tester,
        PlanGateView(scrollController: ScrollController(), status: null, onClose: () {}, showPaidOptions: true),
      );
      expect(find.text('planGate.checking'), findsOneWidget);
      expect(find.byIcon(Icons.close), findsOneWidget);
    });
  });
}
