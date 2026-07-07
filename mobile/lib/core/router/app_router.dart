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
import '../../widgets/app_shell.dart';
import '../../controllers/auth_controller.dart';

CustomTransitionPage<void> _fadeThroughPage(Widget child) {
  return CustomTransitionPage(
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return FadeTransition(opacity: animation, child: child);
    },
    transitionDuration: const Duration(milliseconds: 220),
  );
}

CustomTransitionPage<void> _slideUpPage(Widget child) {
  return CustomTransitionPage(
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
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    redirect: (context, state) {
      if (state.matchedLocation.startsWith('/admin')) {
        final agent = ref.read(authControllerProvider).agent;
        if (agent == null || !agent.isAdmin) return '/profile';
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
        pageBuilder: (context, state) => _fadeThroughPage(RegisterScreen(redirectTo: state.extra as String?)),
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
        path: '/admin/settings',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeThroughPage(const AdminSettingsScreen()),
      ),
    ],
  );
});
