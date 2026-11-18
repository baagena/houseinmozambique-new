// Smoke and layout tests for the agent/admin dashboard screens that mirror
// the website's dashboards. Every screen is pumped at a small phone size with
// enlarged text, from payloads shaped like the real endpoints' responses (and
// from empty ones, which must not crash), and the menus, sheets and forms
// that hold the actions are opened. A RenderFlex overflow or any exception
// fails the test.
//
// No EasyLocalization wrapper: it hangs under `flutter test` (see the
// mobile-test memory note). `.tr()` then returns the key, which is longer than
// the real label, so layout checks are stricter, not weaker.

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/controllers/auth_controller.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/utils/json.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/core/utils/store_policy.dart';
import 'package:mobile/features/admin/admin_agents_screen.dart';
import 'package:mobile/features/admin/admin_content_screen.dart';
import 'package:mobile/features/admin/admin_dashboard_screen.dart';
import 'package:mobile/features/admin/admin_grant_plan_sheet.dart';
import 'package:mobile/features/admin/admin_leads_screen.dart';
import 'package:mobile/features/admin/admin_payments_screens.dart';
import 'package:mobile/features/admin/admin_pricing_screen.dart';
import 'package:mobile/features/admin/admin_requests_screen.dart';
import 'package:mobile/features/admin/admin_subscribers_screen.dart';
import 'package:mobile/features/agent_dashboard/agent_billing_screen.dart';
import 'package:mobile/features/agent_dashboard/agent_requests_screen.dart';
import 'package:mobile/features/agent_dashboard/boost_listing_screen.dart';
import 'package:mobile/features/agent_dashboard/dashboard_home_screen.dart';
import 'package:mobile/features/agent_dashboard/leads_screen.dart';
import 'package:mobile/features/agent_dashboard/my_listings_screen.dart';
import 'package:mobile/models/agent.dart';
import 'package:mobile/models/lead.dart';
import 'package:mobile/models/property.dart';
import 'package:mobile/repositories/admin_repository.dart';
import 'package:mobile/repositories/agent_dashboard_repository.dart';

// ── Fixtures shaped like the live responses ─────────────────────────────────

final _now = DateTime.now().toUtc();
String _iso(Duration ago) => _now.subtract(ago).toIso8601String();

final _instructions = {
  'accountName': 'House in Mozambique Lda',
  'mpesaNumber': '84 000 0000',
  'emolaNumber': '',
  'bankName': 'BCI',
  'bankAccount': '0000 0000 0000 0000',
  'bankIban': 'MZ59 0000 0000 0000 0000 0000 0',
  'notes': 'Write the reference in the description.',
};

final _overview = {
  'needsProfilePhoto': true,
  'stats': {'liveListings': 2, 'pendingListings': 1, 'views': 12345, 'contactClicks': 1, 'leadsThisMonth': 3, 'overdueLeads': 2},
  'attention': [
    {
      'id': 'p1', 'title': 'A very long listing title for a spacious four bedroom villa by the sea in Maputo',
      'titlePt': null, 'status': 'PENDING', 'image': null, 'score': 42, 'band': 'poor',
      'missing': ['photos', 'description', 'area', 'amenities'],
    },
  ],
  'channels': [
    {'channel': 'WHATSAPP', 'count': 7},
    {'channel': 'FORM', 'count': 2},
    {'channel': 'SOMETHING_NEW', 'count': 1},
  ],
};

final _requests = {
  'paid': false,
  'delayHours': 24,
  'requests': [
    {
      'id': 'r1', 'ref': 'REQ-ABC123', 'intent': 'Rent', 'propertyType': 'Apartment', 'city': 'Maputo',
      'areas': 'Sommerschield, Polana Cimento, Costa do Sol', 'budgetMinMinor': 3000000, 'budgetMaxMinor': 9000000,
      'currency': 'MZN', 'minBeds': 3, 'minBaths': null, 'moveBy': _iso(const Duration(days: -30)),
      'notes': 'Needs parking and a generator.', 'createdAt': _iso(const Duration(hours: 30)), 'expiresAt': null,
      'responseCount': 2, 'answered': true, 'anonymous': false,
      'name': 'Buyer Name', 'email': 'buyer@example.com', 'phone': '+258 84 000 0000',
    },
    {
      'id': 'r2', 'ref': 'REQ-XYZ', 'intent': 'Buy', 'propertyType': '', 'city': 'Matola', 'areas': <String>[],
      'budgetMinMinor': null, 'budgetMaxMinor': 500000000, 'currency': 'USD', 'minBeds': null,
      'moveBy': null, 'notes': null, 'createdAt': _iso(const Duration(days: 3)), 'responseCount': 0,
      'answered': false, 'anonymous': true, 'name': null, 'email': null, 'phone': null,
    },
  ],
};

Map<String, dynamic> _billing({required String openStatus}) => {
      'state': {
        'planSlug': 'premium', 'planName': 'Premium', 'quota': 15, 'used': 15, 'remaining': 0, 'credits': 1,
        'canPublish': false, 'nextSource': 'none', 'inGrace': true, 'periodEnd': _iso(const Duration(days: -3)),
      },
      'graceDays': 7,
      'subscription': null,
      'instructions': _instructions,
      'destinationConfigured': true,
      'openPayment': {
        'id': 'pay1', 'orderRef': 'HIM-1731400000000-abcdefghi', 'amountMinor': 350000, 'currency': 'MZN',
        'planType': 'premium', 'planName': 'Premium', 'status': openStatus,
        'reviewNote': openStatus == 'REJECTED' ? 'The reference did not match any M-Pesa transaction.' : null,
        'createdAt': _iso(const Duration(days: 1)),
      },
      'payments': [
        {
          'id': 'pay1', 'orderRef': 'HIM-1731400000000-abcdefghi', 'planName': 'Premium', 'planNameEn': 'Premium',
          'amountMinor': 350000, 'currency': 'MZN', 'method': 'manual', 'planType': 'premium', 'status': openStatus,
          'createdAt': _iso(const Duration(days: 1)), 'completedAt': null, 'reviewNote': null,
        },
      ],
      'plans': [
        {
          'slug': 'standard', 'kind': 'subscription', 'nameEn': 'Standard', 'namePt': 'Padrão', 'descriptionEn': '1 listing',
          'descriptionPt': '1 anúncio', 'priceMinor': 0, 'currency': 'MZN', 'interval': 'month', 'listingQuota': 1,
          'featuredQuota': 0, 'durationDays': null, 'highlighted': false, 'ctaMode': 'checkout',
        },
        {
          'slug': 'premium', 'kind': 'subscription', 'nameEn': 'Premium', 'namePt': 'Premium',
          'descriptionEn': 'Up to 15 listings, featured for seven days, thirty photos per listing and priority support',
          'descriptionPt': '', 'priceMinor': 350000, 'currency': 'MZN', 'interval': 'month', 'listingQuota': 15,
          'featuredQuota': 1, 'durationDays': null, 'highlighted': true, 'ctaMode': 'checkout',
        },
        {
          'slug': 'agency-pro', 'kind': 'subscription', 'nameEn': 'Agency Pro', 'namePt': 'Agência Pro',
          'descriptionEn': 'Unlimited', 'descriptionPt': '', 'priceMinor': 250000050, 'currency': 'MZN', 'interval': 'year',
          'listingQuota': -1, 'featuredQuota': 5, 'durationDays': null, 'highlighted': false, 'ctaMode': 'contact',
        },
      ],
      'credits': [
        {'id': 'c1', 'status': 'AVAILABLE', 'planName': 'Destaque', 'createdAt': _iso(const Duration(days: 2)), 'expiresAt': null},
      ],
    };

final _boost = {
  'offers': [
    {'kind': 'FEATURED', 'nameEn': 'Featured listing', 'namePt': 'Anúncio em destaque', 'descriptionEn': 'Top of search results for a month',
      'descriptionPt': '', 'priceMinor': 150000, 'currency': 'MZN', 'days': 30},
    {'kind': 'URGENT', 'nameEn': 'Urgent badge', 'namePt': 'Urgente', 'descriptionEn': '', 'descriptionPt': '',
      'priceMinor': 50000, 'currency': 'MZN', 'days': 14},
  ],
  'running': [
    {'kind': 'URGENT', 'status': 'PENDING', 'expiresAt': null},
  ],
  'destinationConfigured': false,
};

final _adminOverview = {
  'stats': {'publishedListings': 120, 'totalListings': 150, 'agents': 40, 'inquiries': 400, 'listingViews': 1234567, 'subscribers': 10},
  'counts': {'approvals': 3, 'unreadMessages': 17, 'pendingPayments': 12, 'paymentsToVerify': 4, 'requestsToRelease': 2},
  'recentInquiries': <Map<String, dynamic>>[],
};

final _adminLeads = {
  'leads': [
    {
      'id': 'l1', 'name': 'A buyer with a long name', 'email': 'someone.with.a.long.address@example.com',
      'subject': 'Is the four bedroom villa in Sommerschield still available for viewing this week?',
      'message': 'Hello, I would like to visit.', 'propertyId': 'p1', 'agentId': 'a1', 'listing': 'Villa',
      'agent': 'Ana Sitoe', 'isRead': false, 'repliedAt': null, 'createdAt': _iso(const Duration(hours: 5)),
    },
    {
      'id': 'l2', 'name': 'B', 'email': 'b@example.com', 'subject': 'General question', 'message': 'Hi',
      'propertyId': null, 'agentId': null, 'listing': null, 'agent': null, 'isRead': true,
      'repliedAt': _iso(const Duration(hours: 1)), 'createdAt': _iso(const Duration(days: 2)),
    },
  ],
  'stats': {'last30': 2, 'medianMinutes': 27238.98, 'unansweredPastDay': 18, 'contactRate': 0.61},
};

final _adminRequests = {
  'paidAgentCount': 5,
  'requests': [
    {
      'id': 'r1', 'ref': 'REQ-1', 'status': 'PENDING', 'name': 'Buyer', 'email': 'b@example.com', 'phone': null,
      'anonymous': true, 'intent': 'Rent', 'propertyType': 'House', 'city': 'Maputo', 'areas': 'Triunfo',
      'budgetMinMinor': null, 'budgetMaxMinor': 5000000, 'currency': 'MZN', 'minBeds': 2, 'moveBy': null,
      'notes': '', 'createdAt': _iso(const Duration(days: 1)), 'broadcastAt': null, 'broadcastTo': 0,
      'responseCount': 0, 'reviewedBy': null, 'reviewNote': null,
    },
    {
      'id': 'r2', 'ref': 'REQ-2', 'status': 'MATCHED', 'name': 'Other', 'email': 'o@example.com', 'phone': '840000000',
      'anonymous': false, 'intent': 'Buy', 'propertyType': '', 'city': 'Beira', 'areas': <String>[],
      'createdAt': _iso(const Duration(days: 9)), 'broadcastAt': _iso(const Duration(days: 8)), 'broadcastTo': 4,
      'responseCount': 1, 'reviewNote': 'Released after checking the budget.',
    },
  ],
};

final _verifyQueue = {
  'payments': [
    {
      'id': 'pay1', 'orderRef': 'HIM-1731400000000-abcdefghi', 'amountMinor': 350000, 'currency': 'MZN', 'method': 'manual',
      'planType': 'premium', 'planName': 'Premium', 'planPriceMinor': 400000, 'status': 'PENDING', 'agentId': 'a1',
      'customerName': 'Ana', 'customerEmail': 'ana@example.com', 'customerPhone': null, 'payerReference': null,
      'payerMsisdn': null, 'proofUrl': null, 'proofNote': null, 'submittedAt': null, 'createdAt': _iso(const Duration(days: 2)),
      'reviewNote': null, 'reviewedBy': null,
    },
    {
      'id': 'pay2', 'orderRef': 'HIM-2', 'amountMinor': 150000, 'currency': 'MZN', 'method': 'manual',
      'planType': 'addon-featured', 'planName': null, 'planPriceMinor': null, 'status': 'SUBMITTED', 'agentId': 'a2',
      'customerName': 'Joao', 'customerEmail': 'j@example.com', 'payerReference': 'ABC123XYZ', 'payerMsisdn': '840000000',
      'proofNote': 'Paid from my wife’s phone', 'submittedAt': _iso(const Duration(hours: 3)), 'createdAt': _iso(const Duration(days: 1)),
    },
  ],
};

final _pricing = [
  {
    'id': 'pl1', 'slug': 'premium', 'sortOrder': 1, 'kind': 'subscription', 'priceMinor': 350000, 'currency': 'MZN',
    'interval': 'month', 'listingQuota': 15, 'featuredQuota': 1, 'durationDays': null, 'isActive': true, 'highlighted': true,
    'ctaMode': 'checkout', 'nameEn': 'Premium', 'namePt': 'Premium', 'descriptionEn': '', 'descriptionPt': '',
    'priceEn': '3,500 MZN', 'pricePt': '3.500 MZN', 'unitEn': '/month', 'unitPt': '/mês', 'badgeEn': null, 'badgePt': null,
    'ctaEn': 'Get started', 'ctaPt': 'Começar', 'featuresEn': [{'label': '15 listings', 'included': true, 'star': false}],
    'featuresPt': <Map<String, dynamic>>[],
  },
  {
    'id': 'pl2', 'slug': 'addon-featured', 'sortOrder': 9, 'kind': 'addon', 'priceMinor': 150000, 'currency': 'MZN',
    'interval': null, 'listingQuota': 0, 'featuredQuota': 0, 'durationDays': 30, 'isActive': false, 'highlighted': false,
    'ctaMode': 'checkout', 'nameEn': 'Featured boost', 'namePt': 'Destaque', 'priceEn': '1,500 MZN', 'unitEn': '',
  },
];

final _subscribers = [
  {'id': 's1', 'email': 'reader@example.com', 'isActive': true, 'source': 'footer', 'createdAt': _iso(const Duration(days: 4))},
  {'id': 's2', 'email': 'a.really.long.email.address.for.testing@some-long-domain.example.com', 'isActive': false,
    'source': 'admin', 'createdAt': _iso(const Duration(days: 40))},
];

final _content = {
  'defaults': {
    'en': {'home.hero.title': 'Find your home in Mozambique', 'home.hero.subtitle': 'Thousands of listings'},
    'pt': {'home.hero.title': 'Encontre a sua casa em Moçambique', 'home.hero.subtitle': 'Milhares de anúncios'},
  },
  'overrides': {
    'en': <String, String>{},
    'pt': {'home.hero.title': 'A sua casa, em Moçambique'},
  },
};

final _planInfo = {
  'isCorporate': true,
  'currentPlan': null,
  'credits': 0,
  'listings': {'total': 3, 'live': 2, 'pending': 1, 'rejected': 0},
  'plans': [
    {'slug': 'premium', 'name': 'Premium Subscription', 'kind': 'subscription', 'price': '3.500 MZN /mês', 'listingQuota': 10, 'featuredQuota': 0},
    {'slug': 'destaque', 'name': 'Destaque', 'kind': 'one_off', 'price': '1.000 MZN', 'listingQuota': 1, 'featuredQuota': 1},
  ],
};

Property _property(String id, String status, {String listingType = 'Rent', String priceUnit = 'monthly'}) => Property(
      id: id,
      title: 'Spacious four bedroom villa with a garden and pool in Sommerschield, Maputo',
      description: '',
      location: 'Sommerschield',
      city: 'Maputo',
      price: 2500,
      priceUnit: priceUnit,
      type: 'Villa',
      listingType: listingType,
      bedrooms: 4,
      bathrooms: 3,
      area: 300,
      images: const [],
      hostId: 'a1',
      status: status,
      createdAt: DateTime(2026, 1, 1),
    );

final _properties = [
  _property('p1', 'PUBLISHED'),
  _property('p2', 'PUBLISHED', listingType: 'Buy', priceUnit: 'sale'),
  _property('p3', 'PENDING'),
  _property('p4', 'SUSPENDED'),
  _property('p5', 'REJECTED'),
];

final _leads = [
  Lead(id: 'l1', name: 'Someone', email: 'someone@example.com', subject: 'Viewing request for the villa this weekend please',
      message: 'Hello, can I see it on Saturday morning? I am flexible.', propertyId: 'p1', createdAt: DateTime.now()),
  Lead(id: 'l2', name: 'Read', email: 'read@example.com', subject: 'Price', message: 'Is it negotiable?', isRead: true,
      createdAt: DateTime(2026, 1, 1)),
];

class _SignedInAuth extends AuthController {
  final Agent agent;
  _SignedInAuth(this.agent);
  @override
  AuthState build() => AuthState(status: AuthStatus.authenticated, agent: agent);
}

final _agent = Agent(id: 'a1', name: 'Ana Sitoe', initials: 'AS', title: 'Agent', location: 'Maputo', role: 'AGENT');
final _admin = Agent(id: 'ad1', name: 'Admin Person', initials: 'AP', title: 'Admin', location: 'Maputo', role: 'ADMIN');

class _FakeAdminRepo extends AdminRepository {
  _FakeAdminRepo() : super(ApiClient());
  @override
  Future<Map<String, dynamic>> getLedger({String status = 'all', String q = ''}) async => {
        'totals': {'completedCount': 3, 'completedMinor': 1050000},
        'payments': [
          {
            'id': 'x', 'orderRef': 'HIM-1', 'amountMinor': 350000, 'currency': 'MZN', 'planType': 'premium',
            'planName': 'Premium', 'status': status == 'all' ? 'COMPLETED' : 'PENDING', 'customerName': 'Ana',
            'customerEmail': 'ana@example.com', 'createdAt': _iso(const Duration(days: 1)),
          },
        ],
      };
}

class _QuotaFullRepo extends AgentDashboardRepository {
  _QuotaFullRepo() : super(ApiClient());
  @override
  Future<void> setListingStatus(String id, String action) async {
    throw DioException(
      requestOptions: RequestOptions(path: '/agent/properties/$id/status'),
      error: ApiException(
        'Your Standard plan covers 1 live listing and you have 1. Upgrade, buy a single listing, or take one of your listings down to free a slot.',
        statusCode: 403,
      ),
    );
  }
}

/// Words an iOS reviewer must never see: the App Store notes promise there
/// are no purchases, subscriptions or payments in the iOS app.
final _forbiddenOnIos = RegExp(
  r'upgrade|plan|payment|billing|boost|subscription|seePlans|freeTierDelay|howToPay|sendProof',
  caseSensitive: false,
);

final _menuButton = find.byWidgetPredicate((w) => w is PopupMenuButton);

void _expectNoMoneyText(WidgetTester tester) {
  final texts = tester
      .widgetList<Text>(find.byType(Text, skipOffstage: false))
      .map((t) => t.data ?? t.textSpan?.toPlainText() ?? '')
      .where(_forbiddenOnIos.hasMatch)
      .toList();
  expect(texts, isEmpty, reason: 'money wording visible on iOS: $texts');
}

// ── Harness ─────────────────────────────────────────────────────────────────

Future<void> _pump(WidgetTester tester, Widget screen, {List overrides = const [], Agent? signedIn}) async {
  tester.view.physicalSize = const Size(360 * 3, 740 * 3);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(ProviderScope(
    overrides: [
      authControllerProvider.overrideWith(() => _SignedInAuth(signedIn ?? _agent)),
      ...overrides.cast(),
    ],
    child: MaterialApp(
      theme: AppTheme.light,
      home: MediaQuery(
        data: const MediaQueryData(size: Size(360, 740), textScaler: TextScaler.linear(1.2)),
        child: screen,
      ),
    ),
  ));
  await tester.pumpAndSettle();
}

/// Scroll the first scrollable to the end, so lazily built rows lay out too.
Future<void> _scrollThrough(WidgetTester tester) async {
  final scrollables = find.byType(Scrollable);
  if (scrollables.evaluate().isEmpty) return;
  await tester.drag(scrollables.first, const Offset(0, -4000));
  await tester.pumpAndSettle();
}

void main() {
  group('JSON readers never throw on bad data', () {
    test('missing and mistyped fields fall back', () {
      final m = <String, dynamic>{'n': '12', 'd': 1.6, 'b': 'yes', 'l': 'nope', 'o': 3, 'date': 'garbage'};
      expect(m.integer('n'), 12);
      expect(m.integer('d'), 2);
      expect(m.integer('missing', 7), 7);
      expect(m.flag('b'), false);
      expect(m.objList('l'), isEmpty);
      expect(m.obj('o'), isEmpty);
      expect(m.date('date'), isNull);
      expect(m.strOrNull('missing'), isNull);
      expect(m.str('o'), '3');
      expect(<String, dynamic>{'a': 'X, Y'}.joined('a'), 'X, Y');
      expect(<String, dynamic>{'a': ['X', 'Y']}.joined('a'), 'X, Y');
      expect(m.joined('missing'), '');
    });

    test('money formatting', () {
      expect(formatMinor(350000), '3,500 MZN');
      expect(formatMinor(350050, 'USD'), '3,500.50 USD');
      expect(formatMinor(0), '0 MZN');
    });
  });

  testWidgets('Android shows paid plans in tests (store policy baseline)', (tester) async {
    expect(defaultTargetPlatform, TargetPlatform.android);
    expect(showsPaidPlans, isTrue);
  });

  group('Agent dashboard', () {
    testWidgets('overview', (tester) async {
      await _pump(tester, const DashboardHomeScreen(),
          overrides: [agentOverviewProvider.overrideWith((ref) async => _overview)]);
      expect(find.text('dash.needsAttention'), findsOneWidget);
      await _scrollThrough(tester);
      expect(find.text('dash.billing'), findsOneWidget);
    });

    testWidgets('overview survives an empty payload', (tester) async {
      await _pump(tester, const DashboardHomeScreen(),
          overrides: [agentOverviewProvider.overrideWith((ref) async => <String, dynamic>{})]);
      expect(find.text('dash.liveListings'), findsOneWidget);
    });

    testWidgets('overview shows the API error and a retry', (tester) async {
      await _pump(tester, const DashboardHomeScreen(), overrides: [
        agentOverviewProvider.overrideWith((ref) async => throw ApiException('Server unavailable')),
      ]);
      expect(find.text('Server unavailable'), findsOneWidget);
      expect(find.text('common.retry'), findsOneWidget);
    });

    testWidgets('my listings with the status menu', (tester) async {
      await _pump(tester, const MyListingsScreen(),
          overrides: [myPropertiesProvider.overrideWith((ref) async => _properties)]);
      await tester.tap(find.byIcon(Icons.more_vert).first);
      await tester.pumpAndSettle();
      // Published rental: view, edit, boost, pause, rented, unavailable, delete.
      expect(find.text('dash.boost'), findsOneWidget);
      expect(find.text('dash.markRented'), findsOneWidget);
      expect(find.text('dash.markSold'), findsNothing);
      expect(find.text('dash.reactivate'), findsNothing);
      await tester.tapAt(const Offset(5, 5));
      await tester.pumpAndSettle();
      await _scrollThrough(tester);
    });

    testWidgets('suspended listing offers reactivate, not pause', (tester) async {
      await _pump(tester, const MyListingsScreen(),
          overrides: [myPropertiesProvider.overrideWith((ref) async => [_property('p4', 'SUSPENDED')])]);
      await tester.tap(find.byIcon(Icons.more_vert).first);
      await tester.pumpAndSettle();
      expect(find.text('dash.reactivate'), findsOneWidget);
      expect(find.text('dash.pause'), findsNothing);
      expect(find.text('dash.boost'), findsNothing);
    });

    testWidgets('leads list and detail sheet', (tester) async {
      await _pump(tester, const LeadsScreen(),
          overrides: [myLeadsProvider.overrideWith((ref) async => (_leads, 1))]);
      await tester.tap(find.text('Price'));
      await tester.pumpAndSettle();
      expect(find.text('dash.replyByEmail'), findsOneWidget);
    });

    testWidgets('buyers looking, with the respond sheet', (tester) async {
      await _pump(tester, const AgentRequestsScreen(), overrides: [
        agentRequestsProvider.overrideWith((ref) async => _requests),
        myPropertiesProvider.overrideWith((ref) async => _properties),
      ]);
      expect(find.text('dash.seePlans'), findsOneWidget); // Android shows the upgrade path
      expect(find.text('buyer@example.com'), findsOneWidget); // answered: contact revealed
      expect(find.text('Sommerschield, Polana Cimento, Costa do Sol'), findsOneWidget); // areas is a string
      await _scrollThrough(tester);
      expect(find.text('dash.contactAfterRespond'), findsOneWidget); // anonymous: hidden
      await tester.scrollUntilVisible(find.text('dash.respond'), 100, scrollable: find.byType(Scrollable).first);
      await tester.pumpAndSettle();
      await tester.tap(find.text('dash.respond'));
      await tester.pumpAndSettle();
      expect(find.text('dash.respondMessage'), findsOneWidget);
      expect(find.text('dash.suggestListing (optional)').evaluate().isNotEmpty ||
          find.textContaining('common.optional').evaluate().isNotEmpty, isTrue);
    });

    testWidgets('billing with an unpaid reference shows where to pay and the proof form', (tester) async {
      await _pump(tester, const AgentBillingScreen(),
          overrides: [agentBillingProvider.overrideWith((ref) async => _billing(openStatus: 'PENDING'))]);
      expect(find.text('dash.howToPay'), findsOneWidget);
      await tester.drag(find.byType(Scrollable).first, const Offset(0, -600));
      await tester.pumpAndSettle();
      expect(find.text('dash.sendProof'), findsOneWidget);
      await tester.scrollUntilVisible(find.text('dash.submitProof'), 100, scrollable: find.byType(Scrollable).first);
      await tester.pumpAndSettle();
      await tester.tap(find.text('dash.submitProof'));
      await tester.pumpAndSettle();
      expect(find.text('dash.proofRequired'), findsOneWidget); // empty submit is refused locally
      await _scrollThrough(tester);
    });

    testWidgets('billing after a rejection shows the reason', (tester) async {
      await _pump(tester, const AgentBillingScreen(),
          overrides: [agentBillingProvider.overrideWith((ref) async => _billing(openStatus: 'REJECTED'))]);
      expect(find.text('dash.paymentRejected'), findsOneWidget);
    });

    testWidgets('billing with proof under review hides the form', (tester) async {
      await _pump(tester, const AgentBillingScreen(),
          overrides: [agentBillingProvider.overrideWith((ref) async => _billing(openStatus: 'SUBMITTED'))]);
      expect(find.text('dash.proofUnderReview'), findsOneWidget);
      expect(find.text('dash.sendProof'), findsNothing);
    });

    testWidgets('billing survives an empty payload', (tester) async {
      await _pump(tester, const AgentBillingScreen(),
          overrides: [agentBillingProvider.overrideWith((ref) async => <String, dynamic>{})]);
      expect(find.text('dash.noPlan'), findsOneWidget);
    });

    testWidgets('boost: running boost is locked, others selectable', (tester) async {
      await _pump(tester, const BoostListingScreen(propertyId: 'p1'),
          overrides: [boostOffersProvider('p1').overrideWith((ref) async => _boost)]);
      final tiles = tester.widgetList<CheckboxListTile>(find.byType(CheckboxListTile)).toList();
      expect(tiles.length, 2);
      expect(tiles[0].onChanged, isNotNull); // FEATURED
      expect(tiles[1].onChanged, isNull); // URGENT already pending
      await tester.tap(find.byType(CheckboxListTile).first);
      await tester.pumpAndSettle();
      expect(find.textContaining('1,500 MZN'), findsWidgets);
      await _scrollThrough(tester);
    });
  });

  group('Admin console', () {
    testWidgets('console with badges and money sections', (tester) async {
      await _pump(tester, const AdminDashboardScreen(),
          signedIn: _admin, overrides: [adminOverviewProvider.overrideWith((ref) async => _adminOverview)]);
      expect(find.text('17'), findsOneWidget); // unread leads badge
      expect(find.text('dash.verifyPayments'), findsOneWidget);
      await _scrollThrough(tester);
      expect(find.text('dash.editPages'), findsOneWidget);
    });

    testWidgets('leads with filters and the reply sheet', (tester) async {
      await _pump(tester, const AdminLeadsScreen(),
          signedIn: _admin, overrides: [adminLeadsProvider.overrideWith((ref) async => _adminLeads)]);
      await tester.tap(find.text('dash.filter_unanswered'));
      await tester.pumpAndSettle();
      expect(find.text('General question'), findsNothing);
      await tester.tap(find.textContaining('Is the four bedroom villa'));
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.text('dash.sendReply'));
      await tester.tap(find.text('dash.sendReply'));
      await tester.pumpAndSettle();
      expect(find.text('common.required'), findsOneWidget); // empty reply refused locally
    });

    testWidgets('property requests', (tester) async {
      await _pump(tester, const AdminRequestsScreen(),
          signedIn: _admin, overrides: [adminRequestsProvider.overrideWith((ref) async => _adminRequests)]);
      expect(find.text('dash.release'), findsOneWidget); // only the unreleased PENDING one
      await _scrollThrough(tester);
    });

    testWidgets('verify payments: approve dialog prefilled with the amount', (tester) async {
      await _pump(tester, const AdminVerifyPaymentsScreen(),
          signedIn: _admin, overrides: [adminVerifyQueueProvider.overrideWith((ref) async => _verifyQueue)]);
      // The submitted proof (HIM-2, 1,500 MZN) is sorted to the top, so the
      // first Approve belongs to it.
      expect(find.text('HIM-2'), findsOneWidget);
      await tester.scrollUntilVisible(find.text('common.approve').first, 100, scrollable: find.byType(Scrollable).first);
      await tester.pumpAndSettle();
      await tester.tap(find.text('common.approve').first);
      await tester.pumpAndSettle();
      expect(find.widgetWithText(TextField, '1500'), findsOneWidget);
    });

    testWidgets('payments ledger', (tester) async {
      await _pump(tester, const AdminPaymentsLedgerScreen(),
          signedIn: _admin, overrides: [adminRepositoryProvider.overrideWithValue(_FakeAdminRepo())]);
      expect(find.text('10,500 MZN'), findsOneWidget);
      expect(find.text('COMPLETED'), findsOneWidget);
      await tester.tap(find.text('dash.ledger_pending'));
      await tester.pumpAndSettle();
      expect(find.text('PENDING'), findsOneWidget); // the filter reloads the list
    });

    testWidgets('pricing list and the edit form keeps an add-on an add-on', (tester) async {
      await _pump(tester, const AdminPricingScreen(),
          signedIn: _admin, overrides: [adminPricingProvider.overrideWith((ref) async => _pricing)]);
      await tester.tap(find.text('Featured boost'));
      await tester.pumpAndSettle();
      expect(find.text('dash.kindAddon'), findsOneWidget);
      expect(find.text('dash.durationDays'), findsOneWidget); // not "billed every"
      await _scrollThrough(tester);
    });

    testWidgets('subscribers', (tester) async {
      await _pump(tester, const AdminSubscribersScreen(),
          signedIn: _admin, overrides: [adminSubscribersProvider.overrideWith((ref) async => _subscribers)]);
      expect(find.byType(Switch), findsNWidgets(2));
      await tester.tap(find.byIcon(Icons.send_outlined));
      await tester.pumpAndSettle();
      expect(find.text('dash.sendToCount'), findsOneWidget);
    });

    testWidgets('edit pages: language switch and edited filter', (tester) async {
      await _pump(tester, const AdminContentScreen(),
          signedIn: _admin, overrides: [adminContentProvider.overrideWith((ref) async => _content)]);
      expect(find.text('A sua casa, em Moçambique'), findsOneWidget);
      await tester.tap(find.text('EN'));
      await tester.pumpAndSettle();
      expect(find.text('Find your home in Mozambique'), findsOneWidget);
    });

    testWidgets('grant plan to an agency: no payment confirmation or reference demanded', (tester) async {
      await _pump(
        tester,
        Scaffold(body: Builder(builder: (context) => const AdminGrantPlanSheet(agentId: 'a1', agentName: 'Agency'))),
        signedIn: _admin,
        overrides: [adminAgentPlanInfoProvider('a1').overrideWith((ref) async => _planInfo)],
      );
      expect(find.text('Premium Subscription'), findsOneWidget); // Android/web: plan names
      expect(find.text('dash.forHowLong'), findsOneWidget); // monthly plan selected first
      expect(find.byType(Checkbox), findsNothing);
      expect(find.text('dash.noteOptional'), findsOneWidget);
      // The button is ready straight away — nothing to tick or fill in.
      final button = tester.widget<ElevatedButton>(find.widgetWithText(ElevatedButton, 'dash.activateAgency'));
      expect(button.onPressed, isNotNull);
    });
  });

  group('iOS build shows no prices, plans, payments or upgrades', () {
    setUp(() => debugDefaultTargetPlatformOverride = TargetPlatform.iOS);
    tearDown(() => debugDefaultTargetPlatformOverride = null);

    testWidgets('iPhone admin: "give access" by capability — no plan names, prices or payment', (tester) async {
      await _pump(
        tester,
        Scaffold(body: Builder(builder: (context) => const AdminGrantPlanSheet(agentId: 'a1', agentName: 'Agency'))),
        signedIn: _admin,
        overrides: [adminAgentPlanInfoProvider('a1').overrideWith((ref) async => _planInfo)],
      );
      expect(find.text('dash.giveAccess'), findsOneWidget);
      expect(find.text('dash.chooseAccess'), findsOneWidget);
      expect(find.text('dash.upToListings'), findsOneWidget);
      expect(find.text('dash.oneFeatured'), findsOneWidget);
      expect(find.textContaining('Premium'), findsNothing);
      expect(find.textContaining('MZN'), findsNothing);
      expect(find.textContaining('dash.grantPlan'), findsNothing);
      expect(find.textContaining('dash.currentPlan'), findsNothing);
      debugDefaultTargetPlatformOverride = null;
    });

    testWidgets('store policy flips off on iOS', (tester) async {
      expect(showsPaidPlans, isFalse);
      debugDefaultTargetPlatformOverride = null;
    });

    testWidgets('agent overview has no billing link', (tester) async {
      await _pump(tester, const DashboardHomeScreen(),
          overrides: [agentOverviewProvider.overrideWith((ref) async => _overview)]);
      await _scrollThrough(tester);
      expect(find.text('dash.billing'), findsNothing);
      _expectNoMoneyText(tester);
      debugDefaultTargetPlatformOverride = null;
    });

    testWidgets('listing menu has no boost', (tester) async {
      await _pump(tester, const MyListingsScreen(),
          overrides: [myPropertiesProvider.overrideWith((ref) async => _properties)]);
      await tester.tap(_menuButton.first);
      await tester.pumpAndSettle();
      expect(find.text('dash.boost'), findsNothing);
      _expectNoMoneyText(tester);
      debugDefaultTargetPlatformOverride = null;
    });

    testWidgets('quota-full reactivate never shows the server upgrade text', (tester) async {
      await _pump(tester, const MyListingsScreen(), overrides: [
        myPropertiesProvider.overrideWith((ref) async => [_property('p4', 'SUSPENDED')]),
        agentDashboardRepositoryProvider.overrideWithValue(_QuotaFullRepo()),
      ]);
      await tester.tap(_menuButton.first);
      await tester.pumpAndSettle();
      await tester.tap(find.text('dash.reactivate'));
      await tester.pumpAndSettle();
      expect(find.text('dash.noFreeSlot'), findsOneWidget);
      expect(find.textContaining('Upgrade'), findsNothing);
      debugDefaultTargetPlatformOverride = null;
    });

    testWidgets('buyers looking has no free-tier notice or plans link', (tester) async {
      await _pump(tester, const AgentRequestsScreen(), overrides: [
        agentRequestsProvider.overrideWith((ref) async => _requests),
        myPropertiesProvider.overrideWith((ref) async => _properties),
      ]);
      await _scrollThrough(tester);
      expect(find.text('dash.freeTierDelay'), findsNothing);
      expect(find.text('dash.seePlans'), findsNothing);
      _expectNoMoneyText(tester);
      debugDefaultTargetPlatformOverride = null;
    });

    testWidgets('billing renders nothing even if reached', (tester) async {
      await _pump(tester, const AgentBillingScreen(),
          overrides: [agentBillingProvider.overrideWith((ref) async => _billing(openStatus: 'PENDING'))]);
      expect(find.byType(Text), findsNothing);
      debugDefaultTargetPlatformOverride = null;
    });

    testWidgets('boost renders nothing even if reached', (tester) async {
      await _pump(tester, const BoostListingScreen(propertyId: 'p1'),
          overrides: [boostOffersProvider('p1').overrideWith((ref) async => _boost)]);
      expect(find.byType(Text), findsNothing);
      debugDefaultTargetPlatformOverride = null;
    });

    testWidgets('admin console has no money sections', (tester) async {
      await _pump(tester, const AdminDashboardScreen(),
          signedIn: _admin, overrides: [adminOverviewProvider.overrideWith((ref) async => _adminOverview)]);
      await _scrollThrough(tester);
      expect(find.text('dash.verifyPayments'), findsNothing);
      expect(find.text('dash.paymentsLedger'), findsNothing);
      expect(find.text('dash.pricingPlans'), findsNothing);
      _expectNoMoneyText(tester);
      debugDefaultTargetPlatformOverride = null;
    });

    testWidgets('verify payments renders nothing even if reached', (tester) async {
      await _pump(tester, const AdminVerifyPaymentsScreen(),
          signedIn: _admin, overrides: [adminVerifyQueueProvider.overrideWith((ref) async => _verifyQueue)]);
      expect(find.byType(Text), findsNothing);
      debugDefaultTargetPlatformOverride = null;
    });

    testWidgets('pricing renders nothing even if reached', (tester) async {
      await _pump(tester, const AdminPricingScreen(),
          signedIn: _admin, overrides: [adminPricingProvider.overrideWith((ref) async => _pricing)]);
      expect(find.byType(Text), findsNothing);
      debugDefaultTargetPlatformOverride = null;
    });

    testWidgets('ledger renders nothing even if reached', (tester) async {
      await _pump(tester, const AdminPaymentsLedgerScreen(),
          signedIn: _admin, overrides: [adminRepositoryProvider.overrideWithValue(_FakeAdminRepo())]);
      expect(find.byType(Text), findsNothing);
      debugDefaultTargetPlatformOverride = null;
    });

    testWidgets('admin agent menu says "give access", never "grant plan"', (tester) async {
      await _pump(tester, const AdminAgentsScreen(),
          signedIn: _admin, overrides: [adminAgentsProvider.overrideWith((ref) async => [_agent])]);
      await tester.tap(_menuButton.first);
      await tester.pumpAndSettle();
      expect(find.text('common.edit'), findsOneWidget);
      expect(find.text('dash.grantPlan'), findsNothing);
      expect(find.text('dash.giveAccess'), findsWidgets);
      debugDefaultTargetPlatformOverride = null;
    });
  });
}
