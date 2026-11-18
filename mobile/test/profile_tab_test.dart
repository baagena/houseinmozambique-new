// The Profile tab is one layout for every account. These pump it for a guest
// and for each kind of signed-in account at a small phone size with enlarged
// text (any overflow fails the test), and pin what each one can see.

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:mobile/controllers/auth_controller.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/features/settings/profile_tab_screen.dart';
import 'package:mobile/models/agent.dart';
import 'package:mobile/models/lead.dart';
import 'package:mobile/models/property.dart';
import 'package:mobile/repositories/agent_dashboard_repository.dart';

class _Auth extends AuthController {
  final Agent? agent;
  _Auth(this.agent);
  @override
  AuthState build() => AuthState(
        status: agent == null ? AuthStatus.unauthenticated : AuthStatus.authenticated,
        agent: agent,
      );
}

Agent _account(String role, {bool verified = false}) => Agent(
      id: 'a1',
      name: 'Maria Antonieta dos Santos Machel de Sousa',
      initials: 'MS',
      title: 'Agent',
      location: 'Maputo',
      email: 'a.very.long.email.address.for.testing@some-long-domain.example.com',
      role: role,
      isVerified: verified,
    );

Future<void> _pump(WidgetTester tester, Agent? agent) async {
  SharedPreferences.setMockInitialValues({});
  tester.view.physicalSize = const Size(360 * 3, 740 * 3);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(ProviderScope(
    overrides: [
      authControllerProvider.overrideWith(() => _Auth(agent)),
      myPropertiesProvider.overrideWith((ref) async => <Property>[]),
      myLeadsProvider.overrideWith((ref) async => (<Lead>[], 7)),
    ],
    child: MaterialApp(
      theme: AppTheme.light,
      home: const MediaQuery(
        data: MediaQueryData(size: Size(360, 740), textScaler: TextScaler.linear(1.2)),
        child: ProfileTabScreen(),
      ),
    ),
  ));
  await tester.pumpAndSettle();
}

Future<void> _scrollToEnd(WidgetTester tester) async {
  await tester.drag(find.byType(Scrollable).first, const Offset(0, -3000));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('guest: one sign-in, one sign-up, no account-type sections', (tester) async {
    await _pump(tester, null);
    expect(find.text('auth.signIn'), findsOneWidget);
    expect(find.text('auth.register'), findsOneWidget);
    expect(find.text('profile.listTitle'), findsOneWidget);
    expect(find.text('settings.forProfessionals'), findsNothing);
    expect(find.text('settings.agentLogin'), findsNothing);
    await _scrollToEnd(tester);
    expect(find.text('common.logout'), findsNothing);
  });

  testWidgets('customer: no role label, can start listing, can delete account', (tester) async {
    await _pump(tester, _account('CUSTOMER'));
    expect(find.text('settings.customerBadge'), findsNothing);
    expect(find.text('profile.listTitle'), findsOneWidget);
    expect(find.text('dashboard.title'), findsNothing);
    await _scrollToEnd(tester);
    expect(find.text('common.logout'), findsOneWidget);
    expect(find.text('settings.deleteAccount'), findsOneWidget);
  });

  testWidgets('agent: listing tools and counts, no role label, no admin console', (tester) async {
    await _pump(tester, _account('AGENT', verified: true));
    expect(find.text('settings.agentBadge'), findsNothing);
    expect(find.text('dashboard.title'), findsOneWidget);
    expect(find.text('dash.billing'), findsOneWidget); // agents pay; admins don't
    expect(find.text('7'), findsWidgets); // unread leads, in the header and on the row
    expect(find.byIcon(Icons.verified), findsOneWidget);
    expect(find.text('profile.listTitle'), findsNothing);
    await _scrollToEnd(tester);
    expect(find.text('settings.adminConsole'), findsNothing);
    expect(find.text('settings.deleteAccount'), findsOneWidget);
  });

  testWidgets('owner (lists their own home): listing tools, never asked to register as agent', (tester) async {
    await _pump(tester, _account('OWNER'));
    expect(find.text('dashboard.title'), findsOneWidget);
    expect(find.text('profile.listTitle'), findsNothing); // the "start listing / sign up" card
    expect(find.text('settings.adminConsole'), findsNothing);
  });

  test('owners count as accounts that list property', () {
    expect(_account('OWNER').isAgent, isTrue);
    expect(_account('CUSTOMER').isAgent, isFalse);
  });

  testWidgets('admin: console row, no billing (admins never pay), no delete-account', (tester) async {
    await _pump(tester, _account('ADMIN'));
    expect(find.text('settings.adminBadge'), findsNothing);
    expect(find.text('settings.adminConsole'), findsOneWidget);
    expect(find.text('dash.billing'), findsNothing);
    await _scrollToEnd(tester);
    expect(find.text('settings.deleteAccount'), findsNothing);
  });

  testWidgets('sign out asks first', (tester) async {
    await _pump(tester, _account('AGENT'));
    await _scrollToEnd(tester);
    await tester.tap(find.text('common.logout'));
    await tester.pumpAndSettle();
    expect(find.text('profile.signOutConfirm'), findsOneWidget);
  });

  testWidgets('iPhone: no billing row', (tester) async {
    debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
    await _pump(tester, _account('AGENT'));
    expect(find.text('dash.billing'), findsNothing);
    debugDefaultTargetPlatformOverride = null;
  });
}
