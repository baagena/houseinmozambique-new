import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../models/agent.dart';
import '../../models/property.dart';
import '../../repositories/agent_repository.dart';
import '../../widgets/error_view.dart';
import '../../widgets/property_card.dart';

final agentDetailProvider =
    FutureProvider.autoDispose.family<(Agent, List<Property>), String>((ref, id) {
  return ref.watch(agentRepositoryProvider).getById(id);
});

class AgentDetailScreen extends ConsumerWidget {
  final String agentId;
  const AgentDetailScreen({super.key, required this.agentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(agentDetailProvider(agentId));

    return Scaffold(
      appBar: AppBar(),
      body: detailAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, st) => ErrorView(
          message: err.asApiException?.message,
          onRetry: () => ref.invalidate(agentDetailProvider(agentId)),
        ),
        data: (result) {
          final (agent, properties) = result;
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Center(
                child: CircleAvatar(
                  radius: 48,
                  backgroundColor: AppColors.surfaceVariant,
                  backgroundImage: agent.avatar != null ? CachedNetworkImageProvider(agent.avatar!) : null,
                  child: agent.avatar == null ? Text(agent.initials, style: const TextStyle(fontSize: 24)) : null,
                ),
              ),
              const SizedBox(height: 12),
              Center(child: Text(agent.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold))),
              Center(child: Text('${agent.title} · ${agent.location}', style: const TextStyle(color: AppColors.onSurfaceVariant))),
              if (agent.rating > 0)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.star, size: 18, color: AppColors.secondary),
                        const SizedBox(width: 4),
                        Text('${agent.rating.toStringAsFixed(1)} (${agent.reviewCount})'),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 20),
              if (agent.bio != null && agent.bio!.isNotEmpty) ...[
                Text(agent.bio!, style: const TextStyle(fontSize: 14, height: 1.5)),
                const SizedBox(height: 20),
              ],
              if (agent.specializations.isNotEmpty) ...[
                Text('agent.specializations'.tr(), style: const TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: agent.specializations.map((s) => Chip(label: Text(s))).toList(),
                ),
                const SizedBox(height: 20),
              ],
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.mail_outline),
                  label: Text('agent.contact'.tr()),
                  onPressed: () => context.push('/contact', extra: {'agentId': agent.id}),
                ),
              ),
              const SizedBox(height: 24),
              Text('agent.listings'.tr(), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 16,
                  childAspectRatio: 0.68,
                ),
                itemCount: properties.length,
                itemBuilder: (context, i) => PropertyCard(property: properties[i], width: double.infinity, swipeableImages: true),
              ),
            ],
          );
        },
      ),
    );
  }
}
