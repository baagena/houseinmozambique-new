// Sign-up: four kinds of account (customer, owner, agent, corporate agency),
// each with only the steps it needs. Pumped at a small phone size with
// enlarged text, so any overflow fails. Submissions are captured, not sent.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:mobile/controllers/auth_controller.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/features/agent_auth/register_screen.dart';

class _CapturingAuth extends AuthController {
  static Map<String, dynamic>? last;
  @override
  AuthState build() => AuthState(status: AuthStatus.unauthenticated);

  @override
  Future<void> register({
    required String email,
    required String password,
    required String name,
    String role = 'AGENT',
    required bool acceptedTerms,
    String? phone,
    String? title,
    String? location,
    int? yearsExperience,
    String? bio,
    List<String>? specializations,
    Map<String, dynamic>? extra,
  }) async {
    last = {
      'email': email,
      'name': name,
      'role': role,
      'phone': phone,
      'location': location,
      'acceptedTerms': acceptedTerms,
      ...?extra,
    };
  }
}

Future<void> _pump(WidgetTester tester, {String initial = 'AGENT'}) async {
  tester.view.physicalSize = const Size(360 * 3, 740 * 3);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  _CapturingAuth.last = null;
  final router = GoRouter(routes: [
    GoRoute(path: '/', builder: (_, __) => RegisterScreen(initialAccountType: initial)),
    GoRoute(path: '/profile', builder: (_, __) => const Scaffold(body: Text('PROFILE'))),
    GoRoute(path: '/agent-login', builder: (_, __) => const Scaffold(body: Text('LOGIN'))),
  ]);
  await tester.pumpWidget(ProviderScope(
    overrides: [authControllerProvider.overrideWith(_CapturingAuth.new)],
    child: MaterialApp.router(
      theme: AppTheme.light,
      routerConfig: router,
      builder: (context, child) => MediaQuery(
        data: MediaQuery.of(context).copyWith(textScaler: const TextScaler.linear(1.2)),
        child: child!,
      ),
    ),
  ));
  await tester.pumpAndSettle();
}

Future<void> _pick(WidgetTester tester, String kind) async {
  await tester.ensureVisible(find.text(kind));
  await tester.pumpAndSettle();
  await tester.tap(find.text(kind));
  await tester.pumpAndSettle();
}

Future<void> _continue(WidgetTester tester) async {
  await tester.tap(find.text('common.continue'));
  await tester.pumpAndSettle();
}

Future<void> _type(WidgetTester tester, String label, String value) async {
  final field = find.widgetWithText(TextFormField, label);
  await tester.ensureVisible(field);
  await tester.enterText(field, value);
}

Future<void> _fillAccount(WidgetTester tester, {String nameLabel = 'auth.fullName'}) async {
  await _type(tester, nameLabel, 'Ana Machava');
  await _type(tester, 'auth.email', '  Ana@Example.co.mz ');
  await _type(tester, 'auth.password', 'Secret123');
  await _type(tester, 'auth.confirmPassword', 'Secret123');
}

Future<void> _acceptAndSubmit(WidgetTester tester, String submitLabel) async {
  await tester.tap(find.byType(Checkbox));
  await tester.pumpAndSettle();
  await tester.tap(find.text(submitLabel));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('first screen offers all four kinds of account', (tester) async {
    await _pump(tester);
    for (final key in ['register.typeCustomer', 'register.typeOwner', 'register.typeAgent', 'register.typeCorporate']) {
      expect(find.text(key), findsOneWidget);
    }
    // Only the steps the chosen kind needs.
    expect(find.text('register.stepProfessional'), findsOneWidget); // agent preselected
    await _pick(tester, 'register.typeCorporate');
    expect(find.text('register.stepCompany'), findsOneWidget);
    expect(find.text('register.stepProfessional'), findsNothing);
    await _pick(tester, 'register.typeCustomer');
    expect(find.text('register.stepCompany'), findsNothing);
  });

  testWidgets('owner: two steps, registers as OWNER with a city', (tester) async {
    await _pump(tester);
    await _pick(tester, 'register.typeOwner');
    await _continue(tester);
    await _fillAccount(tester);
    await _type(tester, 'register.city', 'Matola');
    await _acceptAndSubmit(tester, 'register.submitOwner');
    expect(_CapturingAuth.last, isNotNull);
    expect(_CapturingAuth.last!['role'], 'OWNER');
    expect(_CapturingAuth.last!['location'], 'Matola');
    expect(_CapturingAuth.last!['email'], 'ana@example.co.mz');
    expect(find.text('PROFILE'), findsOneWidget);
  });

  testWidgets('corporate: company name and phone are required, then submits the agency', (tester) async {
    await _pump(tester);
    await _pick(tester, 'register.typeCorporate');
    await _continue(tester);
    expect(find.text('register.representativeHeading'), findsOneWidget);
    await _fillAccount(tester, nameLabel: 'register.representativeName');
    await _continue(tester);

    // Company step: nothing filled → stopped with both messages.
    await _continue(tester);
    expect(find.text('register.agencyNameRequired'), findsOneWidget);
    expect(find.text('register.agencyPhoneRequired'), findsOneWidget);
    await _type(tester, 'register.agencyName', 'Consultoria Exemplo, Lda');
    await _type(tester, 'register.agencyPhone', '+258 84 000 1234');
    await _type(tester, 'register.website', 'example.co.mz');
    await _continue(tester);
    expect(find.text('register.websiteInvalid'), findsOneWidget);
    await _type(tester, 'register.website', 'https://example.co.mz');
    await _continue(tester);

    // Services step.
    await tester.tap(find.text('register.service2'));
    await tester.pumpAndSettle();
    await _type(tester, 'register.areas', 'Maputo, Beira');
    await _acceptAndSubmit(tester, 'register.submitCorporate');

    final sent = _CapturingAuth.last!;
    expect(sent['accountType'], 'CORPORATE');
    expect(sent['agencyName'], 'Consultoria Exemplo, Lda');
    expect(sent['agencyPhone'], '+258 84 000 1234');
    expect(sent['agencyWebsite'], 'https://example.co.mz');
    expect(sent['agencyServices'], ['register.service2']);
    expect(sent['agencyAreasServed'], 'Maputo, Beira');
  });

  testWidgets('agent: four steps through to submission', (tester) async {
    await _pump(tester);
    await _continue(tester);
    await _fillAccount(tester);
    await _continue(tester);
    expect(find.text('auth.professionalProfile'), findsOneWidget);
    await _continue(tester);
    expect(find.text('auth.showcaseExpertise'), findsOneWidget);
    await _acceptAndSubmit(tester, 'register.submitAgent');
    expect(_CapturingAuth.last!['role'], 'AGENT');
  });

  testWidgets('bad email or short password stop the account step', (tester) async {
    await _pump(tester, initial: 'CUSTOMER');
    await _continue(tester);
    await _type(tester, 'auth.fullName', 'Ana');
    await _type(tester, 'auth.email', 'not-an-email');
    await _type(tester, 'auth.password', 'short');
    await tester.tap(find.byType(Checkbox));
    await tester.pumpAndSettle();
    await tester.tap(find.text('register.submitCustomer'));
    await tester.pumpAndSettle();
    expect(find.text('auth.emailInvalid'), findsOneWidget);
    expect(find.text('auth.passwordTooShort'), findsOneWidget);
    expect(_CapturingAuth.last, isNull);
  });
}
