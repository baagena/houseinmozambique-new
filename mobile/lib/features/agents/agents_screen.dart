import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../models/agent.dart';
import '../../repositories/agent_repository.dart';
import '../../widgets/error_view.dart';
import '../../widgets/shimmer_loaders.dart';

final agentsListProvider = FutureProvider.autoDispose<List<Agent>>((ref) {
  return ref.watch(agentRepositoryProvider).getAll();
});

class AgentsScreen extends ConsumerWidget {
  const AgentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final agentsAsync = ref.watch(agentsListProvider);

    return Scaffold(
      appBar: AppBar(title: Text('agent.title'.tr())),
      body: agentsAsync.when(
        loading: () => const ListSkeleton(),
        error: (err, st) => ErrorView(
          message: err is ApiException ? err.message : null,
          onRetry: () => ref.invalidate(agentsListProvider),
        ),
        data: (agents) => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: agents.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final agent = agents[index];
            return Card(
              child: ListTile(
                contentPadding: const EdgeInsets.all(12),
                onTap: () => context.push('/agent/${agent.id}'),
                leading: CircleAvatar(
                  radius: 28,
                  backgroundColor: AppColors.surfaceVariant,
                  backgroundImage: agent.avatar != null ? CachedNetworkImageProvider(agent.avatar!) : null,
                  child: agent.avatar == null ? Text(agent.initials) : null,
                ),
                title: Row(
                  children: [
                    Flexible(child: Text(agent.name, style: const TextStyle(fontWeight: FontWeight.w600))),
                    if (agent.isVerified) const Padding(
                      padding: EdgeInsets.only(left: 4),
                      child: Icon(Icons.verified, size: 16, color: AppColors.primary),
                    ),
                  ],
                ),
                subtitle: Text('${agent.title} · ${agent.location}'),
                trailing: agent.rating > 0
                    ? Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star, size: 16, color: AppColors.secondary),
                          const SizedBox(width: 2),
                          Text(agent.rating.toStringAsFixed(1)),
                        ],
                      )
                    : null,
              ),
            );
          },
        ),
      ),
    );
  }
}
