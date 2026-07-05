import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../repositories/agent_dashboard_repository.dart';
import '../../widgets/error_view.dart';
import '../../widgets/shimmer_loaders.dart';

class LeadsScreen extends ConsumerWidget {
  const LeadsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leadsAsync = ref.watch(myLeadsProvider);

    return Scaffold(
      appBar: AppBar(title: Text('dashboard.leads'.tr())),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(myLeadsProvider.future),
        child: leadsAsync.when(
          loading: () => const ListSkeleton(),
          error: (err, st) => ErrorView(
            message: err is ApiException ? err.message : null,
            onRetry: () => ref.invalidate(myLeadsProvider),
          ),
          data: (result) {
            final (leads, _) = result;
            if (leads.isEmpty) {
              return EmptyView(icon: Icons.inbox_outlined, title: 'dashboard.noLeads'.tr());
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: leads.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final lead = leads[index];
                return Dismissible(
                  key: ValueKey(lead.id),
                  direction: DismissDirection.endToStart,
                  background: Container(
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 20),
                    decoration: BoxDecoration(color: AppColors.error, borderRadius: BorderRadius.circular(16)),
                    child: const Icon(Icons.delete, color: Colors.white),
                  ),
                  onDismissed: (_) async {
                    await ref.read(agentDashboardRepositoryProvider).deleteLead(lead.id);
                    ref.invalidate(myLeadsProvider);
                  },
                  child: Card(
                    color: lead.isRead ? null : AppColors.primaryContainer.withValues(alpha: 0.08),
                    child: ListTile(
                      contentPadding: const EdgeInsets.all(14),
                      title: Row(
                        children: [
                          if (!lead.isRead) Container(width: 8, height: 8, margin: const EdgeInsets.only(right: 8), decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)),
                          Expanded(child: Text(lead.subject, style: const TextStyle(fontWeight: FontWeight.w600))),
                        ],
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 4),
                          Text('${lead.name} · ${lead.email}', style: const TextStyle(fontSize: 12)),
                          const SizedBox(height: 4),
                          Text(lead.message, maxLines: 2, overflow: TextOverflow.ellipsis),
                        ],
                      ),
                      trailing: IconButton(
                        icon: Icon(lead.isRead ? Icons.mark_email_read_outlined : Icons.mark_email_unread),
                        onPressed: lead.isRead
                            ? null
                            : () async {
                                await ref.read(agentDashboardRepositoryProvider).markLeadRead(lead.id);
                                ref.invalidate(myLeadsProvider);
                              },
                      ),
                      onTap: () => launchUrl(Uri.parse('mailto:${lead.email}')),
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
