import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/auth_controller.dart';
import '../../core/theme/app_theme.dart';

class ProfileTabScreen extends ConsumerWidget {
  const ProfileTabScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final agent = authState.agent;

    return Scaffold(
      appBar: AppBar(title: Text('nav.profile'.tr())),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (agent != null) ...[
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
            const SizedBox(height: 8),
            _ProfileTile(
              icon: Icons.logout,
              label: 'common.logout'.tr(),
              onTap: () => ref.read(authControllerProvider.notifier).logout(),
            ),
          ] else ...[
            const SizedBox(height: 24),
            Center(
              child: Column(
                children: [
                  const CircleAvatar(radius: 36, backgroundColor: AppColors.surfaceVariant, child: Icon(Icons.person_outline, size: 36)),
                  const SizedBox(height: 12),
                  Text('settings.agentLogin'.tr(), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => context.push('/agent-login'),
                child: Text('auth.signIn'.tr()),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => context.push('/agent-register'),
                child: Text('auth.registerTitle'.tr()),
              ),
            ),
            const SizedBox(height: 16),
            _ProfileTile(icon: Icons.settings_outlined, label: 'settings.title'.tr(), onTap: () => context.push('/settings')),
          ],
        ],
      ),
    );
  }
}

class _ProfileTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _ProfileTile({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon),
      title: Text(label),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}
