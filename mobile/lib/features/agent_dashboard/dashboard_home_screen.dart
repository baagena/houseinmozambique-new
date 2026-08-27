import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/auth_controller.dart';
import '../../core/theme/app_theme.dart';
import '../../repositories/agent_dashboard_repository.dart';

class DashboardHomeScreen extends ConsumerWidget {
  const DashboardHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final agent = ref.watch(authControllerProvider).agent;
    final propertiesAsync = ref.watch(myPropertiesProvider);
    final leadsAsync = ref.watch(myLeadsProvider);

    return Scaffold(
      appBar: AppBar(title: Text('dashboard.title'.tr())),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (agent != null)
            Text('${agent.name} 👋', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          Row(
            // Both cards match the taller one instead of floating at
            // different heights when one label wraps.
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: _StatCard(
                  label: 'dashboard.myListings'.tr(),
                  value: propertiesAsync.maybeWhen(data: (p) => '${p.length}', orElse: () => '-'),
                  icon: Icons.home_work_outlined,
                  onTap: () => context.push('/dashboard/listings'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatCard(
                  label: 'dashboard.leads'.tr(),
                  value: leadsAsync.maybeWhen(data: (l) => '${l.$2}', orElse: () => '-'),
                  icon: Icons.inbox_outlined,
                  onTap: () => context.push('/dashboard/leads'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            icon: const Icon(Icons.add),
            label: Text('dashboard.addListing'.tr()),
            onPressed: () => context.push('/dashboard/listings/new'),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final VoidCallback onTap;

  const _StatCard({required this.label, required this.value, required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: AppColors.primary),
              const SizedBox(height: 12),
              Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              Text(label, style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }
}
