import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/store_policy.dart';
import '../../core/utils/json.dart';
import '../../repositories/admin_repository.dart';
import '../../widgets/dashboard_ui.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final agent = ref.watch(authControllerProvider).agent;
    final overviewAsync = ref.watch(adminOverviewProvider);
    final overview = overviewAsync.asData?.value;
    final counts = overview?.obj('counts') ?? const <String, dynamic>{};
    String? badge(String key) {
      final n = counts.integer(key);
      return n > 0 ? '$n' : null;
    }

    final sections = <_AdminSection>[
      _AdminSection(
        icon: Icons.fact_check_outlined,
        label: 'admin.approvals'.tr(),
        subtitle: 'admin.approvalsDesc'.tr(),
        badge: badge('approvals'),
        color: AppColors.tertiary,
        onTap: () => context.push('/admin/approvals'),
      ),
      _AdminSection(
        icon: Icons.home_work_outlined,
        label: 'admin.properties'.tr(),
        subtitle: 'admin.propertiesDesc'.tr(),
        color: AppColors.primary,
        onTap: () => context.push('/admin/properties'),
      ),
      _AdminSection(
        icon: Icons.groups_outlined,
        label: 'admin.agents'.tr(),
        subtitle: 'admin.agentsDesc'.tr(),
        color: AppColors.primary,
        onTap: () => context.push('/admin/agents'),
      ),
      _AdminSection(
        icon: Icons.forum_outlined,
        label: 'dash.adminLeads'.tr(),
        subtitle: 'dash.adminLeadsDesc'.tr(),
        badge: badge('unreadMessages'),
        color: AppColors.tertiary,
        onTap: () => context.push('/admin/leads'),
      ),
      _AdminSection(
        icon: Icons.person_search_outlined,
        label: 'dash.propertyRequests'.tr(),
        subtitle: 'dash.propertyRequestsDesc'.tr(),
        badge: badge('requestsToRelease'),
        color: AppColors.secondary,
        onTap: () => context.push('/admin/requests'),
      ),
      // Money: never on iOS (see store_policy.dart).
      if (showsPaidPlans) ...[
        _AdminSection(
          icon: Icons.verified_outlined,
          label: 'dash.verifyPayments'.tr(),
          subtitle: 'dash.verifyPaymentsDesc'.tr(),
          badge: badge('paymentsToVerify'),
          color: AppColors.tertiary,
          onTap: () => context.push('/admin/payments/verify'),
        ),
        _AdminSection(
          icon: Icons.receipt_long_outlined,
          label: 'dash.paymentsLedger'.tr(),
          subtitle: 'dash.paymentsLedgerDesc'.tr(),
          color: AppColors.primary,
          onTap: () => context.push('/admin/payments'),
        ),
        _AdminSection(
          icon: Icons.sell_outlined,
          label: 'dash.pricingPlans'.tr(),
          subtitle: 'dash.pricingPlansDesc'.tr(),
          color: AppColors.secondary,
          onTap: () => context.push('/admin/pricing'),
        ),
      ],
      _AdminSection(
        icon: Icons.notifications_active_outlined,
        label: 'admin.activity'.tr(),
        subtitle: 'admin.activityDesc'.tr(),
        color: AppColors.tertiary,
        onTap: () => context.push('/admin/activities'),
      ),
      _AdminSection(
        icon: Icons.article_outlined,
        label: 'admin.blog'.tr(),
        subtitle: 'admin.blogDesc'.tr(),
        color: AppColors.secondary,
        onTap: () => context.push('/admin/blog'),
      ),
      _AdminSection(
        icon: Icons.group_add_outlined,
        label: 'dash.subscribers'.tr(),
        subtitle: 'dash.subscribersDesc'.tr(),
        color: AppColors.primary,
        onTap: () => context.push('/admin/subscribers'),
      ),
      _AdminSection(
        icon: Icons.edit_document,
        label: 'dash.editPages'.tr(),
        subtitle: 'dash.editPagesDesc'.tr(),
        color: AppColors.primary,
        onTap: () => context.push('/admin/content'),
      ),
      _AdminSection(
        icon: Icons.campaign_outlined,
        label: 'admin.ads'.tr(),
        subtitle: 'admin.adsDesc'.tr(),
        color: AppColors.secondary,
        onTap: () => context.push('/admin/ads'),
      ),
      _AdminSection(
        icon: Icons.settings_outlined,
        label: 'admin.settings'.tr(),
        subtitle: 'admin.settingsDesc'.tr(),
        color: AppColors.onSurfaceVariant,
        onTap: () => context.push('/admin/settings'),
      ),
    ];

    final stats = overview?.objOrNull('stats');

    return Scaffold(
      appBar: AppBar(title: Text('admin.console'.tr())),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(adminPendingPropertiesProvider);
          ref.invalidate(adminOverviewProvider);
          await ref.read(adminOverviewProvider.future);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (agent != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Text(
                  'admin.welcome'.tr(args: [agent.name]),
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
            if (stats != null) ...[
              StatGrid(tiles: [
                StatTile(
                  label: 'dash.liveListings'.tr(),
                  value: '${stats.integer('publishedListings')}',
                  icon: Icons.check_circle_outline,
                  onTap: () => context.push('/admin/properties'),
                ),
                StatTile(
                  label: 'admin.agents'.tr(),
                  value: '${stats.integer('agents')}',
                  icon: Icons.groups_outlined,
                  onTap: () => context.push('/admin/agents'),
                ),
                StatTile(
                  label: 'dash.views'.tr(),
                  value: '${stats.integer('listingViews')}',
                  icon: Icons.visibility_outlined,
                ),
                StatTile(
                  label: 'dashboard.leads'.tr(),
                  value: '${stats.integer('inquiries')}',
                  icon: Icons.inbox_outlined,
                  onTap: () => context.push('/admin/leads'),
                ),
              ]),
              const SizedBox(height: 16),
            ] else if (overviewAsync.hasError)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Text(
                  overviewAsync.error.asApiException?.message ?? 'common.somethingWentWrong'.tr(),
                  style: const TextStyle(color: AppColors.error),
                ),
              ),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: sections.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.98,
              ),
              itemBuilder: (context, i) => _AnimatedSectionCard(section: sections[i], index: i),
            ),
          ],
        ),
      ),
    );
  }
}

class _AdminSection {
  final IconData icon;
  final String label;
  final String subtitle;
  final String? badge;
  final Color color;
  final VoidCallback onTap;

  _AdminSection({
    required this.icon,
    required this.label,
    required this.subtitle,
    this.badge,
    required this.color,
    required this.onTap,
  });
}

class _AnimatedSectionCard extends StatefulWidget {
  final _AdminSection section;
  final int index;
  const _AnimatedSectionCard({required this.section, required this.index});

  @override
  State<_AnimatedSectionCard> createState() => _AnimatedSectionCardState();
}

class _AnimatedSectionCardState extends State<_AnimatedSectionCard> with SingleTickerProviderStateMixin {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final s = widget.section;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: 260 + widget.index * 40),
      curve: Curves.easeOutCubic,
      builder: (context, value, child) {
        return Opacity(
          opacity: value,
          child: Transform.translate(offset: Offset(0, (1 - value) * 12), child: child),
        );
      },
      child: GestureDetector(
        onTapDown: (_) => setState(() => _pressed = true),
        onTapUp: (_) => setState(() => _pressed = false),
        onTapCancel: () => setState(() => _pressed = false),
        onTap: s.onTap,
        child: AnimatedScale(
          scale: _pressed ? 0.96 : 1,
          duration: const Duration(milliseconds: 100),
          child: Card(
            margin: EdgeInsets.zero,
            child: Stack(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: s.color.withValues(alpha: 0.12), shape: BoxShape.circle),
                        child: Icon(s.icon, color: s.color),
                      ),
                      const Spacer(),
                      Text(s.label, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                      const SizedBox(height: 2),
                      Text(s.subtitle, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 11)),
                    ],
                  ),
                ),
                if (s.badge != null)
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(color: AppColors.error, borderRadius: BorderRadius.circular(10)),
                      child: Text(s.badge!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
