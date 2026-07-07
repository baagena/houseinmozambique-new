import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/auth_controller.dart';
import '../../controllers/favorites_controller.dart';
import '../../core/theme/app_theme.dart';

class ProfileTabScreen extends ConsumerWidget {
  const ProfileTabScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final agent = authState.agent;
    final favoritesCount = ref.watch(favoritesControllerProvider).length;

    return Scaffold(
      appBar: AppBar(title: Text('nav.profile'.tr())),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (agent != null && agent.isCustomer) ...[
            Card(
              child: ListTile(
                contentPadding: const EdgeInsets.all(16),
                leading: CircleAvatar(
                  radius: 28,
                  backgroundColor: AppColors.surfaceVariant,
                  backgroundImage: agent.avatar != null ? CachedNetworkImageProvider(agent.avatar!) : null,
                  child: agent.avatar == null ? Text(agent.initials) : null,
                ),
                title: Text(agent.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text('settings.customerBadge'.tr()),
              ),
            ),
            const SizedBox(height: 16),
            _ProfileTile(
              icon: Icons.favorite_outline,
              label: 'nav.favorites'.tr(),
              trailingText: favoritesCount > 0 ? '$favoritesCount' : null,
              onTap: () => context.push('/favorites'),
            ),
            _ProfileTile(icon: Icons.support_agent_outlined, label: 'settings.helpContact'.tr(), onTap: () => context.push('/contact')),
            _ProfileTile(icon: Icons.settings_outlined, label: 'settings.title'.tr(), onTap: () => context.push('/settings')),
            const SizedBox(height: 8),
            _ProfileTile(
              icon: Icons.logout,
              label: 'common.logout'.tr(),
              onTap: () => ref.read(authControllerProvider.notifier).logout(),
            ),
            const SizedBox(height: 8),
            _ProfileTile(
              icon: Icons.real_estate_agent_outlined,
              label: 'settings.becomeAgent'.tr(),
              onTap: () => context.push('/agent-register', extra: {'accountType': 'AGENT'}),
            ),
          ] else if (agent != null) ...[
            Card(
              child: ListTile(
                contentPadding: const EdgeInsets.all(16),
                leading: CircleAvatar(
                  radius: 28,
                  backgroundColor: AppColors.surfaceVariant,
                  backgroundImage: agent.avatar != null ? CachedNetworkImageProvider(agent.avatar!) : null,
                  child: agent.avatar == null ? Text(agent.initials) : null,
                ),
                title: Text(agent.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text(agent.title),
              ),
            ),
            const SizedBox(height: 16),
            _ProfileTile(icon: Icons.dashboard_outlined, label: 'dashboard.title'.tr(), onTap: () => context.push('/dashboard')),
            _ProfileTile(icon: Icons.home_work_outlined, label: 'dashboard.myListings'.tr(), onTap: () => context.push('/dashboard/listings')),
            _ProfileTile(icon: Icons.inbox_outlined, label: 'dashboard.leads'.tr(), onTap: () => context.push('/dashboard/leads')),
            _ProfileTile(icon: Icons.person_outline, label: 'dashboard.profile'.tr(), onTap: () => context.push('/dashboard/profile')),
            _ProfileTile(icon: Icons.settings_outlined, label: 'settings.title'.tr(), onTap: () => context.push('/settings')),
            if (agent.isAdmin) ...[
              const SizedBox(height: 8),
              _ProfileTile(
                icon: Icons.admin_panel_settings_outlined,
                label: 'Admin Console',
                onTap: () => context.push('/admin'),
              ),
            ],
            const SizedBox(height: 8),
            _ProfileTile(
              icon: Icons.logout,
              label: 'common.logout'.tr(),
              onTap: () => ref.read(authControllerProvider.notifier).logout(),
            ),
          ] else ...[
            // Neutral welcome for every visitor — browsing, favorites and
            // contact all work without an account, so lead with that instead
            // of demanding a sign-in first.
            Row(
              children: [
                const CircleAvatar(
                  radius: 26,
                  backgroundColor: AppColors.surfaceVariant,
                  child: Icon(Icons.person_outline, size: 26, color: AppColors.onSurfaceVariant),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('settings.guestTitle'.tr(), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                      const SizedBox(height: 2),
                      Text('settings.guestSubtitle'.tr(), style: const TextStyle(fontSize: 12.5, color: AppColors.onSurfaceVariant)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            _ProfileTile(
              icon: Icons.favorite_outline,
              label: 'nav.favorites'.tr(),
              trailingText: favoritesCount > 0 ? '$favoritesCount' : null,
              onTap: () => context.push('/favorites'),
            ),
            _ProfileTile(icon: Icons.support_agent_outlined, label: 'settings.helpContact'.tr(), onTap: () => context.push('/contact')),
            _ProfileTile(icon: Icons.settings_outlined, label: 'settings.title'.tr(), onTap: () => context.push('/settings')),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainer,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  const Icon(Icons.sync_outlined, color: AppColors.primary),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('settings.syncFavoritesTitle'.tr(), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                        const SizedBox(height: 2),
                        Text('settings.syncFavoritesSubtitle'.tr(), style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed: () => context.push('/agent-register', extra: {'accountType': 'CUSTOMER'}),
                    child: Text('settings.syncFavoritesCta'.tr()),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            const Divider(height: 32),
            Text('settings.forProfessionals'.tr(), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [AppColors.primary, AppColors.primaryContainer], begin: Alignment.topLeft, end: Alignment.bottomRight),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                    child: const Icon(Icons.real_estate_agent_outlined, color: AppColors.primary, size: 26),
                  ),
                  const SizedBox(height: 16),
                  Text('settings.agentLogin'.tr(), style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Text('settings.agentLoginSubtitle'.tr(), style: const TextStyle(color: Colors.white70, fontSize: 13.5)),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: AppColors.primary),
                      onPressed: () => context.push('/agent-login'),
                      child: Text('auth.signIn'.tr()),
                    ),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(foregroundColor: Colors.white, side: const BorderSide(color: Colors.white70)),
                      onPressed: () => context.push('/agent-register'),
                      child: Text('auth.registerTitle'.tr()),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const _BenefitRow(icon: Icons.home_work_outlined, labelKey: 'settings.benefitListings'),
            const _BenefitRow(icon: Icons.forum_outlined, labelKey: 'settings.benefitLeads'),
            const _BenefitRow(icon: Icons.insights_outlined, labelKey: 'settings.benefitInsights'),
          ],
        ],
      ),
    );
  }
}

class _BenefitRow extends StatelessWidget {
  final IconData icon;
  final String labelKey;
  const _BenefitRow({required this.icon, required this.labelKey});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(color: AppColors.surfaceContainer, shape: BoxShape.circle),
            child: Icon(icon, size: 18, color: AppColors.primary),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(labelKey.tr(), style: const TextStyle(fontSize: 13.5, color: AppColors.onSurfaceVariant))),
        ],
      ),
    );
  }
}

class _ProfileTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final String? trailingText;
  const _ProfileTile({required this.icon, required this.label, required this.onTap, this.trailingText});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon),
      title: Text(label),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (trailingText != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
              decoration: BoxDecoration(color: AppColors.secondaryContainer, borderRadius: BorderRadius.circular(12)),
              child: Text(trailingText!, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.onSecondaryContainer)),
            ),
            const SizedBox(width: 8),
          ],
          const Icon(Icons.chevron_right),
        ],
      ),
      onTap: onTap,
    );
  }
}
