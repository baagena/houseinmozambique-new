import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/auth_controller.dart';
import '../../controllers/favorites_controller.dart';
import '../../core/theme/app_theme.dart';
import '../../models/agent.dart';

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
          if (agent == null)
            ..._buildGuest(context, favoritesCount)
          else if (agent.isCustomer)
            ..._buildCustomer(context, ref, agent, favoritesCount)
          else
            ..._buildAgent(context, ref, agent),
        ],
      ),
    );
  }

  // ── Guest: explain the two account types and where each signs in ──────────

  List<Widget> _buildGuest(BuildContext context, int favoritesCount) {
    return [
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
      const SizedBox(height: 24),
      _SectionLabel('settings.yourAccount'.tr()),
      const SizedBox(height: 12),
      // Customer account: free, favorites sync across devices.
      Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.outlineVariant),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: const BoxDecoration(color: AppColors.secondaryContainer, shape: BoxShape.circle),
                  child: const Icon(Icons.person_add_alt_outlined, color: AppColors.onSecondaryContainer, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text('settings.customerCardTitle'.tr(), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text('settings.customerCardBody'.tr(), style: const TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant)),
            const SizedBox(height: 14),
            _BenefitRow(icon: Icons.favorite_outline, labelKey: 'settings.benefitSyncFavorites'),
            _BenefitRow(icon: Icons.forum_outlined, labelKey: 'settings.benefitFasterContact'),
            const SizedBox(height: 4),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => context.push('/agent-register', extra: {'accountType': 'CUSTOMER'}),
                    child: Text('auth.register'.tr()),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => context.push('/agent-login'),
                    child: Text('auth.signIn'.tr()),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text('settings.oneSignInNote'.tr(), style: const TextStyle(fontSize: 11.5, color: AppColors.onSurfaceVariant)),
          ],
        ),
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
      const Divider(height: 32),
      _SectionLabel('settings.forProfessionals'.tr()),
      const SizedBox(height: 12),
      // Agent account: the professional pitch.
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
                onPressed: () => context.push('/agent-register', extra: {'accountType': 'AGENT'}),
                child: Text('settings.becomeAgent'.tr()),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(foregroundColor: Colors.white, side: const BorderSide(color: Colors.white70)),
                onPressed: () => context.push('/agent-login'),
                child: Text('auth.signIn'.tr()),
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 16),
      const _BenefitRow(icon: Icons.home_work_outlined, labelKey: 'settings.benefitListings'),
      const _BenefitRow(icon: Icons.forum_outlined, labelKey: 'settings.benefitLeads'),
      const _BenefitRow(icon: Icons.insights_outlined, labelKey: 'settings.benefitInsights'),
    ];
  }

  // ── Signed in as customer ─────────────────────────────────────────────────

  List<Widget> _buildCustomer(BuildContext context, WidgetRef ref, Agent agent, int favoritesCount) {
    return [
      _AccountHeader(agent: agent, badge: 'settings.customerBadge'.tr()),
      const SizedBox(height: 20),
      _ProfileTile(
        icon: Icons.favorite_outline,
        label: 'nav.favorites'.tr(),
        trailingText: favoritesCount > 0 ? '$favoritesCount' : null,
        onTap: () => context.push('/favorites'),
      ),
      _ProfileTile(icon: Icons.support_agent_outlined, label: 'settings.helpContact'.tr(), onTap: () => context.push('/contact')),
      _ProfileTile(icon: Icons.settings_outlined, label: 'settings.title'.tr(), onTap: () => context.push('/settings')),
      const Divider(height: 32),
      _SectionLabel('settings.forProfessionals'.tr()),
      const SizedBox(height: 12),
      // Upgrade path: customers can become agents without a new account flow.
      Container(
        decoration: BoxDecoration(
          color: AppColors.surfaceContainer,
          borderRadius: BorderRadius.circular(16),
        ),
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          leading: Container(
            padding: const EdgeInsets.all(10),
            decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
            child: const Icon(Icons.real_estate_agent_outlined, color: Colors.white, size: 22),
          ),
          title: Text('settings.becomeAgent'.tr(), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5)),
          subtitle: Text('settings.becomeAgentSubtitle'.tr(), style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => context.push('/agent-register', extra: {'accountType': 'AGENT'}),
        ),
      ),
      const SizedBox(height: 20),
      _SignOutTile(onTap: () => ref.read(authControllerProvider.notifier).logout()),
    ];
  }

  // ── Signed in as agent (or admin) ─────────────────────────────────────────

  List<Widget> _buildAgent(BuildContext context, WidgetRef ref, Agent agent) {
    return [
      _AccountHeader(
        agent: agent,
        badge: agent.isAdmin ? 'settings.adminBadge'.tr() : 'settings.agentBadge'.tr(),
        verified: agent.isVerified,
      ),
      const SizedBox(height: 20),
      _ProfileTile(icon: Icons.dashboard_outlined, label: 'dashboard.title'.tr(), onTap: () => context.push('/dashboard')),
      _ProfileTile(icon: Icons.person_outline, label: 'settings.editProfile'.tr(), onTap: () => context.push('/dashboard/profile')),
      _ProfileTile(icon: Icons.support_agent_outlined, label: 'settings.helpContact'.tr(), onTap: () => context.push('/contact')),
      _ProfileTile(icon: Icons.settings_outlined, label: 'settings.title'.tr(), onTap: () => context.push('/settings')),
      // Deliberately discreet: only admins ever see this entry.
      if (agent.isAdmin)
        _ProfileTile(
          icon: Icons.admin_panel_settings_outlined,
          label: 'settings.adminConsole'.tr(),
          onTap: () => context.push('/admin'),
        ),
      const SizedBox(height: 20),
      _SignOutTile(onTap: () => ref.read(authControllerProvider.notifier).logout()),
    ];
  }
}

class _AccountHeader extends StatelessWidget {
  final Agent agent;
  final String badge;
  final bool verified;
  const _AccountHeader({required this.agent, required this.badge, this.verified = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: AppColors.surfaceVariant,
            backgroundImage: agent.avatar != null ? CachedNetworkImageProvider(agent.avatar!) : null,
            child: agent.avatar == null ? Text(agent.initials, style: const TextStyle(fontWeight: FontWeight.w700)) : null,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(agent.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16), maxLines: 1, overflow: TextOverflow.ellipsis),
                if ((agent.email ?? agent.title).isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(agent.email ?? agent.title, style: const TextStyle(fontSize: 12.5, color: AppColors.onSurfaceVariant), maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
                const SizedBox(height: 8),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(color: AppColors.secondaryContainer, borderRadius: BorderRadius.circular(12)),
                      child: Text(badge, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.onSecondaryContainer)),
                    ),
                    if (verified) ...[
                      const SizedBox(width: 8),
                      const Icon(Icons.verified, size: 15, color: AppColors.primary),
                      const SizedBox(width: 3),
                      Text('agent.verified'.tr(), style: const TextStyle(fontSize: 11.5, color: AppColors.primary, fontWeight: FontWeight.w600)),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(text, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15));
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

class _SignOutTile extends StatelessWidget {
  final VoidCallback onTap;
  const _SignOutTile({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: const Icon(Icons.logout, color: AppColors.error),
      title: Text('common.logout'.tr(), style: const TextStyle(color: AppColors.error, fontWeight: FontWeight.w600)),
      onTap: onTap,
    );
  }
}
