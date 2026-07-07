import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../models/agent.dart';
import '../../repositories/admin_repository.dart';
import '../../widgets/error_view.dart';
import '../../widgets/shimmer_loaders.dart';
import 'admin_agent_form_screen.dart';

class AdminAgentsScreen extends ConsumerWidget {
  const AdminAgentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final agentsAsync = ref.watch(adminAgentsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Agents'),
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
              return const EmptyView(icon: Icons.groups_outlined, title: 'No agents yet');
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

  Color _roleColor() {
    switch (agent.role) {
      case 'ADMIN':
        return AppColors.tertiary;
      case 'REVOKED':
        return AppColors.error;
      default:
        return AppColors.primary;
    }
  }

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
        subtitle: Text('${agent.title} · ${agent.propertyCount} listing(s)'),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              margin: const EdgeInsets.only(right: 4),
              decoration: BoxDecoration(color: _roleColor().withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
              child: Text(agent.role, style: TextStyle(color: _roleColor(), fontSize: 11, fontWeight: FontWeight.w600)),
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
                      title: const Text('Delete agent?'),
                      content: Text('This will permanently remove ${agent.name}.'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                        TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete')),
                      ],
                    ),
                  );
                  if (confirmed == true) {
                    try {
                      await ref.read(adminRepositoryProvider).deleteAgent(agent.id);
                      ref.invalidate(adminAgentsProvider);
                    } catch (e) {
                      if (context.mounted) {
                        final message = e.asApiException?.message ?? 'Failed to delete agent';
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
                      }
                    }
                  }
                }
              },
              itemBuilder: (context) => [
                const PopupMenuItem(value: 'edit', child: Text('Edit')),
                if (agent.role != 'REVOKED') const PopupMenuItem(value: 'revoke', child: Text('Revoke access')),
                const PopupMenuItem(value: 'delete', child: Text('Delete')),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
