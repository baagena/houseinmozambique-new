import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/splash/splash_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/search/search_screen.dart';
import '../../features/favorites/favorites_screen.dart';
import '../../features/agents/agents_screen.dart';
import '../../features/agents/agent_detail_screen.dart';
import '../../features/settings/profile_tab_screen.dart';
import '../../features/settings/settings_screen.dart';
import '../../features/property_detail/property_detail_screen.dart';
import '../../features/blog/blog_list_screen.dart';
import '../../features/blog/blog_detail_screen.dart';
import '../../features/contact/contact_screen.dart';
import '../../features/agent_auth/login_screen.dart';
import '../../features/agent_auth/register_screen.dart';
import '../../features/agent_dashboard/dashboard_home_screen.dart';
import '../../features/agent_dashboard/my_listings_screen.dart';
import '../../features/agent_dashboard/listing_form_screen.dart';
import '../../features/agent_dashboard/leads_screen.dart';
import '../../features/agent_dashboard/agent_profile_screen.dart';
import '../../features/admin/admin_dashboard_screen.dart';
import '../../features/admin/admin_approvals_screen.dart';
import '../../features/admin/admin_agents_screen.dart';
import '../../features/admin/admin_properties_screen.dart';
import '../../features/admin/admin_ads_screen.dart';
import '../../features/admin/admin_blog_screen.dart';
import '../../features/admin/admin_activities_screen.dart';
import '../../features/admin/admin_settings_screen.dart';
import '../../features/agent_dashboard/agent_requests_screen.dart';
import '../../features/agent_dashboard/agent_billing_screen.dart';
import '../../features/agent_dashboard/boost_listing_screen.dart';
import '../../features/admin/admin_leads_screen.dart';
import '../../features/admin/admin_requests_screen.dart';
import '../../features/admin/admin_payments_screens.dart';
import '../../features/admin/admin_pricing_screen.dart';
import '../../features/admin/admin_subscribers_screen.dart';
import '../../features/admin/admin_content_screen.dart';
import '../../widgets/app_shell.dart';
import '../utils/store_policy.dart';
import '../../services/firebase_services.dart';
import '../../controllers/auth_controller.dart';

/// A normal pushed page. It uses the platform's own transition from the
/// theme (app_theme.dart), which is what makes back-swipes interactive: the
/// page follows the finger on Android (predictive back) and iPhone (edge
/// swipe). The previous custom fade turned the iPhone swipe off entirely and
/// on Android gave no feedback until the finger was lifted.
Page<void> _fadeThroughPage(Widget child) => MaterialPage<void>(child: child);

CustomTransitionPage<void> _slideUpPage(Widget child) {
  return CustomTransitionPage(
    opaque: false,
    barrierColor: Colors.black54,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final tween = Tween(begin: const Offset(0, 1), end: Offset.zero)
          .chain(CurveTween(curve: Curves.easeOutCubic));
      return SlideTransition(position: animation.drive(tween), child: child);
    },
    transitionDuration: const Duration(milliseconds: 280),
  );
}

final _rootNavigatorKey = GlobalKey<NavigatorState>();

final appRouterProvider = Provider<GoRouter>((ref) {
  final router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    redirect: (context, state) {
      final agent = ref.read(authControllerProvider).agent;
      final loc = state.matchedLocation;
      if (loc.startsWith('/admin')) {
        if (agent == null || !agent.isAdmin) return '/profile';
        // Payments and prices never show on iOS (store_policy.dart).
        if (!showsPaidPlans && (loc.startsWith('/admin/payments') || loc == '/admin/pricing')) return '/admin';
      }
      if (loc == '/dashboard' || loc.startsWith('/dashboard/')) {
        if (agent == null || !agent.isAgent) return '/profile';
        if (!showsPaidPlans && (loc == '/dashboard/billing' || loc.endsWith('/boost'))) return '/dashboard';
      }
      // Agent-only bottom-nav tabs.
      if (state.matchedLocation == '/my-listings' || state.matchedLocation == '/my-leads') {
        if (agent == null || !agent.isAgent) return '/profile';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/onboarding', builder: (context, state) => const OnboardingScreen()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => AppShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/explore', builder: (context, state) => const SearchScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/agents', builder: (context, state) => const AgentsScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/profile', builder: (context, state) => const ProfileTabScreen()),
          ]),
          // Agent-only tabs: the bottom nav swaps Explore/Agents for these
          // when an agent or admin is signed in (see AppShell).
          StatefulShellBranch(routes: [
            GoRoute(path: '/my-listings', builder: (context, state) => const MyListingsScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/my-leads', builder: (context, state) => const LeadsScreen()),
          ]),
        ],
      ),
      GoRoute(
        path: '/favorites',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const FavoritesScreen()),
      ),
      GoRoute(
        path: '/property/:id',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return _fadeThroughPage(PropertyDetailScreen(
            propertyId: state.pathParameters['id']!,
            heroTag: extra?['heroTag'] as String?,
          ));
        },
      ),
      GoRoute(
        path: '/agent/:id',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(AgentDetailScreen(agentId: state.pathParameters['id']!)),
      ),
      GoRoute(
        path: '/settings',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const SettingsScreen()),
      ),
      GoRoute(
        path: '/blog',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const BlogListScreen()),
      ),
      GoRoute(
        path: '/blog/:slug',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(BlogDetailScreen(slug: state.pathParameters['slug']!)),
      ),
      GoRoute(
        path: '/contact',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final extra = state.extra as Map<String, String>?;
          return _slideUpPage(ContactScreen(
            propertyId: extra?['propertyId'],
            agentId: extra?['agentId'],
            prefillSubject: extra?['subject'],
          ));
        },
      ),
      GoRoute(
        path: '/agent-login',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(LoginScreen(redirectTo: state.extra as String?)),
      ),
      GoRoute(
        path: '/agent-register',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final extra = state.extra;
          final redirectTo = extra is Map ? extra['redirectTo'] as String? : extra as String?;
          final accountType = extra is Map ? (extra['accountType'] as String? ?? 'AGENT') : 'AGENT';
          return _fadeThroughPage(RegisterScreen(redirectTo: redirectTo, initialAccountType: accountType));
        },
      ),
      GoRoute(
        path: '/dashboard',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const DashboardHomeScreen()),
      ),
      GoRoute(
        path: '/dashboard/listings',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const MyListingsScreen()),
      ),
      GoRoute(
        path: '/dashboard/listings/new',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _slideUpPage(const ListingFormScreen()),
      ),
      GoRoute(
        path: '/dashboard/listings/:id/edit',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _slideUpPage(ListingFormScreen(propertyId: state.pathParameters['id'])),
      ),
      GoRoute(
        path: '/dashboard/listings/:id/boost',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(BoostListingScreen(propertyId: state.pathParameters['id']!)),
      ),
      GoRoute(
        path: '/dashboard/requests',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const AgentRequestsScreen()),
      ),
      GoRoute(
        path: '/dashboard/billing',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const AgentBillingScreen()),
      ),
      GoRoute(
        path: '/dashboard/leads',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const LeadsScreen()),
      ),
      GoRoute(
        path: '/dashboard/profile',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const AgentProfileScreen()),
      ),
      GoRoute(
        path: '/admin',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const AdminDashboardScreen()),
      ),
      GoRoute(
        path: '/admin/approvals',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const AdminApprovalsScreen()),
      ),
      GoRoute(
        path: '/admin/agents',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const AdminAgentsScreen()),
      ),
      GoRoute(
        path: '/admin/properties',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const AdminPropertiesScreen()),
      ),
      GoRoute(
        path: '/admin/ads',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const AdminAdsScreen()),
      ),
      GoRoute(
        path: '/admin/blog',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const AdminBlogScreen()),
      ),
      GoRoute(
        path: '/admin/activities',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const AdminActivitiesScreen()),
      ),
      GoRoute(
        path: '/admin/leads',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const AdminLeadsScreen()),
      ),
      GoRoute(
        path: '/admin/requests',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const AdminRequestsScreen()),
      ),
      GoRoute(
        path: '/admin/payments',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const AdminPaymentsLedgerScreen()),
      ),
      GoRoute(
        path: '/admin/payments/verify',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const AdminVerifyPaymentsScreen()),
      ),
      GoRoute(
        path: '/admin/pricing',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const AdminPricingScreen()),
      ),
      GoRoute(
        path: '/admin/subscribers',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const AdminSubscribersScreen()),
      ),
      GoRoute(
        path: '/admin/content',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const AdminContentScreen()),
      ),
      GoRoute(
        path: '/admin/settings',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const AdminSettingsScreen()),
      ),
    ],
  );
  // Analytics: one screen_view per screen, named by its route pattern
  // ("/property/:id"), so ids never reach Google Analytics.
  void track() {
    try {
      Analytics.screen(router.routerDelegate.currentConfiguration.fullPath);
    } catch (_) {}
  }
  router.routerDelegate.addListener(track);
  ref.onDispose(() => router.routerDelegate.removeListener(track));
  return router;
});
