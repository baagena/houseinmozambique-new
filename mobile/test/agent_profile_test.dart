// Agent profiles: a corporate agency (markets its services, posts nothing)
// and a regular agent, at a small phone size with enlarged text (any overflow
// fails the test). Every contact press must be recorded for the agent.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/features/agents/agent_detail_screen.dart';
import 'package:mobile/features/agents/agents_screen.dart';
import 'package:mobile/models/agent.dart';
import 'package:mobile/models/property.dart';
import 'package:mobile/services/contact_tracker.dart';

class _Recorder extends ContactTracker {
  final List<String> presses = [];
  _Recorder() : super(ApiClient());
  @override
  void profile(String agentId, String channel) => presses.add('$agentId:$channel');
  @override
  void listing(String propertyId, String event) => presses.add('listing:$event');
}

Agent _company() => Agent.fromJson({
      'id': 'c1',
      'name': 'Maria Antonieta dos Santos',
      'initials': 'MS',
      'title': 'Director',
      'location': 'Maputo',
      'phone': '84 123 4567',
      'agencyName': 'Construções e Consultoria Imobiliária de Moçambique, Lda',
      'agencyBusinessType': 'Consultoria imobiliária',
      'agencyAbout': 'We advise companies, institutions and government on property projects.',
      'agencyServices': ['Property consultancy', 'Valuation', 'Investment guidance', 'Commercial real estate'],
      'agencyAreasServed': ['Maputo', 'Matola', 'Beira', 'Nampula'],
      'agencyWebsite': 'https://example.co.mz',
      'agencyEmail': 'info@example.co.mz',
      'socialLinks': {
        'facebook': 'https://www.facebook.com/example',
        'linkedin': 'https://www.linkedin.com/company/example',
        'instagram': 'https://www.instagram.com/example',
        'bogus': 'http://not-shown',
      },
      'isVerified': true,
      'isCorporate': true,
      'yearsExperience': 15,
      '_count': {'properties': 0},
    });

Agent _person({String? phone = '845550000'}) => Agent.fromJson({
      'id': 'a1',
      'name': 'João Carlos Mabunda',
      'initials': 'JM',
      'title': 'Real estate agent',
      'location': 'Matola',
      'phone': phone,
      '_count': {'properties': 0},
    });

Future<_Recorder> _pump(WidgetTester tester, Widget child, {List<Override> overrides = const [], double height = 740}) async {
  tester.view.physicalSize = Size(360 * 3, height * 3);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  // Links can't open in a test; the screen must cope (it shows a message).
  tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
    const MethodChannel('plugins.flutter.io/url_launcher'),
    (call) async => false,
  );
  final recorder = _Recorder();
  await tester.pumpWidget(ProviderScope(
    overrides: [contactTrackerProvider.overrideWithValue(recorder), ...overrides],
    child: MaterialApp(
      theme: AppTheme.light,
      home: MediaQuery(
        data: MediaQueryData(size: Size(360, height), textScaler: const TextScaler.linear(1.2)),
        child: child,
      ),
    ),
  ));
  await tester.pumpAndSettle();
  return recorder;
}

/// Scrolls the profile until [finder] is on screen (sections further down
/// are only built once scrolled near).
Future<void> _reveal(WidgetTester tester, Finder finder) async {
  await tester.scrollUntilVisible(finder, 200, scrollable: find.byType(Scrollable).first);
  await tester.pumpAndSettle();
}

void main() {
  test('only real https social links are kept', () {
    expect(_company().socialLinks.keys, containsAll(['facebook', 'linkedin', 'instagram']));
    expect(_company().socialLinks.containsKey('bogus'), isFalse);
    expect(_company().isCorporate, isTrue);
    expect(_company().displayName, startsWith('Construções'));
    expect(_person().isCorporate, isFalse);
  });

  testWidgets('corporate agency: company layout, no empty listings section', (tester) async {
    await _pump(
      tester,
      const AgentDetailScreen(agentId: 'c1'),
      overrides: [agentDetailProvider('c1').overrideWith((ref) async => (_company(), <Property>[]))],
    );
    expect(find.textContaining('Construções e Consultoria'), findsWidgets);
    expect(find.text('agentProfile.corporate'), findsOneWidget);
    await _reveal(tester, find.text('agentProfile.website'));
    expect(find.text('agentProfile.email'), findsOneWidget);
    await _reveal(tester, find.byTooltip('LinkedIn'));
    expect(find.byTooltip('Facebook'), findsOneWidget);
    await _reveal(tester, find.text('agentProfile.aboutCompany'));
    await _reveal(tester, find.text('Valuation'));
    expect(find.text('agentProfile.services'), findsOneWidget);
    await _reveal(tester, find.text('agentProfile.representedBy'));
    // A company that posts nothing shows no "Listings" heading or empty box.
    expect(find.text('agent.listings'), findsNothing);
    expect(find.text('agentProfile.noListings'), findsNothing);
    // WhatsApp is the main button, with Call beside it.
    expect(find.text('agentProfile.whatsapp'), findsOneWidget);
  });

  testWidgets('every contact press is recorded', (tester) async {
    final recorder = await _pump(
      tester,
      const AgentDetailScreen(agentId: 'c1'),
      overrides: [agentDetailProvider('c1').overrideWith((ref) async => (_company(), <Property>[]))],
    );
    await tester.tap(find.text('agentProfile.whatsapp'));
    await tester.pumpAndSettle();
    await _reveal(tester, find.byTooltip('LinkedIn'));
    await tester.tap(find.byTooltip('LinkedIn'));
    await tester.pumpAndSettle();
    await _reveal(tester, find.text('agentProfile.website'));
    await tester.tap(find.text('agentProfile.website'));
    await tester.pumpAndSettle();
    expect(recorder.presses, ['c1:whatsapp', 'c1:linkedin', 'c1:website']);
  });

  testWidgets('agent without listings: says so, and Call is the main button without WhatsApp data',
      (tester) async {
    await _pump(
      tester,
      const AgentDetailScreen(agentId: 'a1'),
      overrides: [agentDetailProvider('a1').overrideWith((ref) async => (_person(), <Property>[]))],
    );
    expect(find.text('agentProfile.professional'), findsOneWidget);
    await _reveal(tester, find.text('agentProfile.noListings'));
    // The phone doubles as WhatsApp.
    expect(find.text('agentProfile.whatsapp'), findsOneWidget);
  });

  testWidgets('no phone at all: the message form is the way to reach them', (tester) async {
    await _pump(
      tester,
      const AgentDetailScreen(agentId: 'a1'),
      overrides: [agentDetailProvider('a1').overrideWith((ref) async => (_person(phone: null), <Property>[]))],
    );
    expect(find.text('agentProfile.whatsapp'), findsNothing);
    expect(find.text('agentProfile.message'), findsWidgets);
  });

  testWidgets('directory: companies first in their own section, then agents', (tester) async {
    await _pump(
      tester,
      const AgentsScreen(),
      overrides: [agentsListProvider.overrideWith((ref) async => [_person(), _company()])],
      height: 1400,
    );
    final companies = tester.getTopLeft(find.text('agentProfile.sectionCompanies')).dy;
    final agents = tester.getTopLeft(find.text('agentProfile.sectionAgents')).dy;
    final company = tester.getTopLeft(find.textContaining('Construções')).dy;
    final person = tester.getTopLeft(find.text('João Carlos Mabunda')).dy;
    expect(companies < company && company < agents && agents < person, isTrue);
    // The company card shows what it does and where.
    expect(find.text('Property consultancy'), findsOneWidget);
    expect(find.textContaining('agentProfile.moreCount'), findsOneWidget); // 4 services → 3 + "+1"
  });

  testWidgets('directory without companies: no empty company section', (tester) async {
    await _pump(
      tester,
      const AgentsScreen(),
      overrides: [agentsListProvider.overrideWith((ref) async => [_person()])],
    );
    expect(find.text('agentProfile.sectionCompanies'), findsNothing);
    expect(find.text('agentProfile.sectionAgents'), findsOneWidget);
  });

  testWidgets('long directory: the section heading stays pinned while scrolling', (tester) async {
    final many = [
      _company(),
      for (var i = 0; i < 30; i++)
        Agent.fromJson({'id': 'p$i', 'name': 'Agent number $i', 'initials': 'A', 'title': 'Agent', 'location': 'Maputo', '_count': {'properties': i}}),
    ];
    await _pump(tester, const AgentsScreen(), overrides: [agentsListProvider.overrideWith((ref) async => many)]);
    await tester.drag(find.byType(Scrollable).first, const Offset(0, -1500));
    await tester.pumpAndSettle();
    expect(find.text('agentProfile.sectionAgents'), findsOneWidget);
    expect(tester.getTopLeft(find.text('agentProfile.sectionAgents')).dy, lessThan(160));
  });

  testWidgets('directory: filter to companies, search, quick WhatsApp is recorded', (tester) async {
    final recorder = await _pump(
      tester,
      const AgentsScreen(),
      overrides: [agentsListProvider.overrideWith((ref) async => [_company(), _person()])],
      height: 1400,
    );
    expect(find.textContaining('Construções'), findsOneWidget);
    expect(find.text('João Carlos Mabunda'), findsOneWidget);

    await tester.tap(find.textContaining('agentProfile.filterCompanies'));
    await tester.pumpAndSettle();
    expect(find.text('João Carlos Mabunda'), findsNothing);

    await tester.tap(find.textContaining('agentProfile.filterAll'));
    await tester.enterText(find.byType(TextField), 'matola');
    await tester.pumpAndSettle();
    // Both match Matola (the company serves it); a nonsense search matches nobody.
    expect(find.text('João Carlos Mabunda'), findsOneWidget);
    await tester.enterText(find.byType(TextField), 'zzz');
    await tester.pumpAndSettle();
    expect(find.text('agentProfile.noResults'), findsOneWidget);

    await tester.enterText(find.byType(TextField), '');
    await tester.pumpAndSettle();
    await tester.tap(find.text('agentProfile.whatsapp').first); // the company card's button
    await tester.pumpAndSettle();
    expect(recorder.presses, ['c1:whatsapp']);
  });
}
