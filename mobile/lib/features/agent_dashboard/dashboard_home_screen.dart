import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/json.dart';
import '../../core/utils/labels.dart';
import '../../core/utils/store_policy.dart';
import '../../repositories/agent_dashboard_repository.dart';
import '../../widgets/dashboard_ui.dart';
import '../../widgets/error_view.dart';

/// The agent overview — the same figures as the website's dashboard/agent.
class DashboardHomeScreen extends ConsumerWidget {
  const DashboardHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final agent = ref.watch(authControllerProvider).agent;
    final overviewAsync = ref.watch(agentOverviewProvider);
    final lang = Localizations.localeOf(context).languageCode;

    Future<void> refresh() async {
      ref.invalidate(myLeadsProvider);
      ref.invalidate(myPropertiesProvider);
      ref.invalidate(agentOverviewProvider);
      await ref.read(agentOverviewProvider.future);
    }

    final links = <_DashLink>[
      _DashLink(Icons.home_work_outlined, 'dashboard.myListings'.tr(), '/dashboard/listings'),
      _DashLink(Icons.inbox_outlined, 'dashboard.leads'.tr(), '/dashboard/leads'),
      _DashLink(Icons.person_search_outlined, 'dash.buyersLooking'.tr(), '/dashboard/requests'),
      if (showsPaidPlans && agent?.isAdmin != true) _DashLink(Icons.payments_outlined, 'dash.billing'.tr(), '/dashboard/billing'),
      _DashLink(Icons.person_outline, 'settings.editProfile'.tr(), '/dashboard/profile'),
      _DashLink(Icons.settings_outlined, 'dashboard.settings'.tr(), '/settings'),
    ];

    return Scaffold(
      appBar: AppBar(title: Text('dashboard.title'.tr())),
      body: RefreshIndicator(
        onRefresh: refresh,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (agent != null)
              Text('${agent.name} 👋', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              icon: const Icon(Icons.add),
              label: Text('dashboard.addListing'.tr()),
              onPressed: () => context.push('/dashboard/listings/new'),
            ),
            const SizedBox(height: 16),
            overviewAsync.when(
              loading: () => const Padding(
                padding: EdgeInsets.all(32),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, _) => ErrorView(
                message: e.asApiException?.message,
                onRetry: () => ref.invalidate(agentOverviewProvider),
              ),
              data: (data) => _OverviewBody(data: data, lang: lang),
            ),
            SectionTitle('dash.manage'.tr()),
            ...links.map((l) => Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: Icon(l.icon, color: AppColors.primary),
                    title: Text(l.label),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push(l.route),
                  ),
                )),
          ],
        ),
      ),
    );
  }
}

class _DashLink {
  final IconData icon;
  final String label;
  final String route;
  const _DashLink(this.icon, this.label, this.route);
}

class _OverviewBody extends StatelessWidget {
  final Map<String, dynamic> data;
  final String lang;
  const _OverviewBody({required this.data, required this.lang});

  @override
  Widget build(BuildContext context) {
    final stats = data.obj('stats');
    final attention = data.objList('attention');
    final channels = data.objList('channels');
    final overdue = stats.integer('overdueLeads');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (data.flag('needsProfilePhoto')) ...[
          NoticeCard(
            icon: Icons.add_a_photo_outlined,
            text: 'dash.needsPhoto'.tr(),
            action: TextButton(
              onPressed: () => context.push('/dashboard/profile'),
              child: Text('settings.editProfile'.tr()),
            ),
          ),
          const SizedBox(height: 12),
        ],
        if (overdue > 0) ...[
          NoticeCard(
            icon: Icons.schedule,
            color: AppColors.error,
            text: 'dash.overdueLeads'.tr(args: ['$overdue']),
            action: TextButton(
              onPressed: () => context.push('/dashboard/leads'),
              child: Text('dashboard.leads'.tr()),
            ),
          ),
          const SizedBox(height: 12),
        ],
        StatGrid(tiles: [
          StatTile(
            label: 'dash.liveListings'.tr(),
            value: '${stats.integer('liveListings')}',
            icon: Icons.check_circle_outline,
            onTap: () => context.push('/dashboard/listings'),
          ),
          StatTile(
            label: 'dash.pendingListings'.tr(),
            value: '${stats.integer('pendingListings')}',
            icon: Icons.hourglass_top,
            color: AppColors.secondary,
            onTap: () => context.push('/dashboard/listings'),
          ),
          StatTile(label: 'dash.views'.tr(), value: '${stats.integer('views')}', icon: Icons.visibility_outlined),
          StatTile(
            label: 'dash.contactClicks'.tr(),
            value: '${stats.integer('contactClicks')}',
            icon: Icons.touch_app_outlined,
          ),
          StatTile(
            label: 'dash.leadsThisMonth'.tr(),
            value: '${stats.integer('leadsThisMonth')}',
            icon: Icons.inbox_outlined,
            onTap: () => context.push('/dashboard/leads'),
          ),
          StatTile(
            label: 'dash.overdue'.tr(),
            value: '$overdue',
            icon: Icons.schedule,
            color: overdue > 0 ? AppColors.error : AppColors.outline,
            onTap: () => context.push('/dashboard/leads'),
          ),
        ]),
        if (attention.isNotEmpty) ...[
          SectionTitle('dash.needsAttention'.tr()),
          ...attention.map((a) {
            final title = (lang == 'pt' ? a.strOrNull('titlePt') : null) ?? a.str('title');
            final image = a.strOrNull('image');
            final missing = a.strList('missing');
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: image == null
                      ? Container(width: 48, height: 48, color: AppColors.surfaceVariant)
                      : CachedNetworkImage(imageUrl: image, width: 48, height: 48, fit: BoxFit.cover),
                ),
                title: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
                subtitle: Text(
                  [
                    'dash.qualityScore'.tr(args: ['${a.integer('score')}']),
                    statusLabel(a.str('status')),
                    if (missing.isNotEmpty) 'dash.missing'.tr(args: [missing.take(3).join(', ')]),
                  ].join(' · '),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12),
                ),
                trailing: const Icon(Icons.edit_outlined),
                onTap: () => context.push('/dashboard/listings/${a.str('id')}/edit'),
              ),
            );
          }),
        ],
        if (channels.isNotEmpty) ...[
          SectionTitle('dash.howBuyersReached'.tr()),
          Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                children: channels.map((c) {
                  final total = channels.fold<int>(0, (s, x) => s + x.integer('count'));
                  final count = c.integer('count');
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 5),
                    child: Row(
                      children: [
                        SizedBox(width: 90, child: Text(_channelLabel(c.str('channel')))),
                        Expanded(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: total == 0 ? 0 : count / total,
                              minHeight: 8,
                              backgroundColor: AppColors.surfaceContainer,
                            ),
                          ),
                        ),
                        SizedBox(width: 40, child: Text('$count', textAlign: TextAlign.end)),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ],
    );
  }

  static String _channelLabel(String channel) {
    switch (channel.toUpperCase()) {
      case 'WHATSAPP':
        return 'WhatsApp';
      case 'CALL':
      case 'PHONE':
        return 'dash.channelCall'.tr();
      case 'EMAIL':
        return 'Email';
      case 'FORM':
        return 'dash.channelForm'.tr();
      // Presses on the agent's own profile.
      case 'WEBSITE':
        return 'dash.channelWebsite'.tr();
      case 'FACEBOOK':
        return 'Facebook';
      case 'INSTAGRAM':
        return 'Instagram';
      case 'LINKEDIN':
        return 'LinkedIn';
      case 'TIKTOK':
        return 'TikTok';
      case 'YOUTUBE':
        return 'YouTube';
      case 'X':
        return 'X';
      default:
        return channel;
    }
  }
}
