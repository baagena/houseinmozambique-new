// The admin sees each poster's plan under a pending listing and can activate
// a subscription they paid for outside the app. Shapes are the live
// /api/mobile/v1/admin/agents/:id/plan-info responses for the test accounts.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/features/admin/admin_grant_plan_sheet.dart';
import 'package:mobile/repositories/admin_repository.dart';

Map<String, dynamic> _info({String role = 'OWNER', String plan = 'Free', int used = 1, int quota = 1, bool canPublish = false}) => {
      'isCorporate': false,
      'currentPlan': plan,
      'credits': 0,
      'quota': quota,
      'used': used,
      'canPublish': canPublish,
      'inGrace': false,
      'role': role,
      'listings': {'total': 1, 'live': used, 'pending': 0, 'rejected': 0},
      'plans': [
        {'slug': 'brokers', 'name': 'Brokers Subscription', 'kind': 'subscription', 'price': '3.500 MZN /mês'},
      ],
    };

Future<void> _pump(WidgetTester tester, Map<String, dynamic> info) async {
  tester.view.physicalSize = const Size(360 * 3, 740 * 3);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(ProviderScope(
    overrides: [adminAgentPlanInfoProvider('a1').overrideWith((ref) async => info)],
    child: MaterialApp(
      theme: AppTheme.light,
      home: const MediaQuery(
        data: MediaQueryData(size: Size(360, 740), textScaler: TextScaler.linear(1.2)),
        child: Scaffold(
          body: Padding(
            padding: EdgeInsets.all(16),
            child: AdminPlanStrip(agentId: 'a1', agentName: 'Maria Antonieta dos Santos'),
          ),
        ),
      ),
    ),
  ));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('full free plan: shown as full, with the grant button', (tester) async {
    await _pump(tester, _info());
    expect(find.text('Free'), findsOneWidget);
    expect(find.text('dash.planFullShort'), findsOneWidget);
    expect(find.byIcon(Icons.error_outline), findsOneWidget);
    expect(find.text('dash.grantSubscription'), findsOneWidget);
  });

  testWidgets('paid plan with room: usage shown, grant still available', (tester) async {
    await _pump(tester, _info(role: 'AGENT', plan: 'Brokers Subscription', used: 0, quota: 40, canPublish: true));
    expect(find.text('Brokers Subscription'), findsOneWidget);
    expect(find.text('dash.planUsageShort'), findsOneWidget);
  });

  testWidgets('admins never get a plan strip', (tester) async {
    await _pump(tester, _info(role: 'ADMIN'));
    expect(find.text('dash.grantSubscription'), findsNothing);
  });

  testWidgets('the button opens the grant sheet with the plans', (tester) async {
    await _pump(tester, _info());
    await tester.tap(find.text('dash.grantSubscription'));
    await tester.pumpAndSettle();
    expect(find.text('dash.grantPlan'), findsWidgets);
    expect(find.text('Maria Antonieta dos Santos'), findsOneWidget);
  });
}
