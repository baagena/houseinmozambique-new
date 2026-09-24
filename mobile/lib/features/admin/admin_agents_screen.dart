import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../models/agent.dart';
import '../../repositories/admin_repository.dart';
import '../../widgets/error_view.dart';
import '../../widgets/shimmer_loaders.dart';
import '../../widgets/status_badge.dart';
import 'admin_agent_form_screen.dart';

class AdminAgentsScreen extends ConsumerWidget {
  const AdminAgentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final agentsAsync = ref.watch(adminAgentsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('admin.agents'.tr()),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_alt_1_outlined),
            onPressed: () async {
              final created = await Navigator.of(context).push<bool>(
                MaterialPageRoute(builder: (_) => const AdminAgentFormScreen()),
              );
              if (created == true) ref.invalidate(adminAgentsProvider);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(adminAgentsProvider.future),
        child: agentsAsync.when(
          loading: () => const ListSkeleton(),
          error: (err, st) => ErrorView(
            message: err.asApiException?.message,
            onRetry: () => ref.invalidate(adminAgentsProvider),
          ),
          data: (agents) {
            if (agents.isEmpty) {
              return EmptyView(icon: Icons.groups_outlined, title: 'admin.noAgents'.tr());
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: agents.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) => _AgentTile(agent: agents[i]),
            );
          },
        ),
      ),
    );
  }
}

class _AgentTile extends ConsumerWidget {
  final Agent agent;
  const _AgentTile({required this.agent});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        leading: CircleAvatar(
          backgroundColor: AppColors.primaryContainer,
          backgroundImage: agent.avatar != null ? NetworkImage(agent.avatar!) : null,
          child: agent.avatar == null ? Text(agent.initials, style: const TextStyle(color: Colors.white)) : null,
        ),
        title: Text(agent.name, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text('${agent.title} · ${'admin.listingsCount'.tr(args: ['${agent.propertyCount}'])}'),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.only(right: 4),
              child: StatusBadge(status: agent.role),
            ),
            PopupMenuButton<String>(
              onSelected: (value) async {
                if (value == 'edit') {
                  final updated = await Navigator.of(context).push<bool>(
                    MaterialPageRoute(builder: (_) => AdminAgentFormScreen(agent: agent)),
                  );
                  if (updated == true) ref.invalidate(adminAgentsProvider);
                } else if (value == 'revoke') {
                  await ref.read(adminRepositoryProvider).revokeAgent(agent.id);
                  ref.invalidate(adminAgentsProvider);
                } else if (value == 'delete') {
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: Text('admin.deleteAgentTitle'.tr()),
                      content: Text('admin.deleteAgentBody'.tr(args: [agent.name])),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('common.cancel'.tr())),
                        TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text('common.delete'.tr())),
                      ],
                    ),
                  );
                  if (confirmed == true) {
                    try {
                      await ref.read(adminRepositoryProvider).deleteAgent(agent.id);
                      ref.invalidate(adminAgentsProvider);
                    } catch (e) {
                      if (context.mounted) {
                        final message = e.asApiException?.message ?? 'admin.deleteAgentFailed'.tr();
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
                      }
                    }
                  }
                }
              },
              itemBuilder: (context) => [
                PopupMenuItem(value: 'edit', child: Text('common.edit'.tr())),
                if (agent.role != 'REVOKED') PopupMenuItem(value: 'revoke', child: Text('admin.revokeAccess'.tr())),
                PopupMenuItem(value: 'delete', child: Text('common.delete'.tr())),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
