import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/json.dart';
import '../../models/lead.dart';
import '../../repositories/agent_dashboard_repository.dart';
import '../../widgets/dashboard_ui.dart';
import '../../widgets/error_view.dart';
import '../../widgets/shimmer_loaders.dart';
import '../../widgets/sheets.dart';

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
            message: err.asApiException?.message,
            onRetry: () => ref.invalidate(myLeadsProvider),
          ),
          data: (result) {
            final (leads, _) = result;
            if (leads.isEmpty) {
              return ListView(children: [
                const SizedBox(height: 80),
                EmptyView(icon: Icons.inbox_outlined, title: 'dashboard.noLeads'.tr()),
              ]);
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: leads.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) => _LeadCard(lead: leads[index]),
            );
          },
        ),
      ),
    );
  }
}

class _LeadCard extends ConsumerWidget {
  final Lead lead;
  const _LeadCard({required this.lead});

  Future<void> _markRead(BuildContext context, WidgetRef ref) async {
    if (lead.isRead) return;
    if (await runAction(context, () => ref.read(agentDashboardRepositoryProvider).markLeadRead(lead.id))) {
      ref.invalidate(myLeadsProvider);
    }
  }

  Future<void> _delete(BuildContext context, WidgetRef ref) async {
    final ok = await confirmDialog(
      context,
      title: 'dash.deleteLeadTitle'.tr(),
      body: lead.subject,
      confirmLabel: 'common.delete'.tr(),
      destructive: true,
    );
    if (!ok || !context.mounted) return;
    if (await runAction(context, () => ref.read(agentDashboardRepositoryProvider).deleteLead(lead.id))) {
      ref.invalidate(myLeadsProvider);
    }
  }

  void _open(BuildContext context, WidgetRef ref) {
    _markRead(context, ref);
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.6,
        maxChildSize: 0.95,
        builder: (ctx, controller) => ListView(
          controller: controller,
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          children: [
            SheetTitle(lead.subject, onClose: () => Navigator.pop(ctx)),
            InfoRow('admin.fullName'.tr(), lead.name),
            InfoRow('admin.email'.tr(), lead.email, copyable: true),
            InfoRow('dash.received'.tr(), formatDateTime(lead.createdAt)),
            const Divider(height: 24),
            SelectableText(lead.message, style: const TextStyle(fontSize: 14.5, height: 1.4)),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              icon: const Icon(Icons.reply),
              label: Text('dash.replyByEmail'.tr()),
              onPressed: () => launchUrl(Uri(
                scheme: 'mailto',
                path: lead.email,
                queryParameters: {'subject': 'Re: ${lead.subject}'},
              )),
            ),
            if (lead.propertyId != null) ...[
              const SizedBox(height: 8),
              OutlinedButton.icon(
                icon: const Icon(Icons.home_outlined),
                label: Text('dash.viewListing'.tr()),
                onPressed: () {
                  Navigator.pop(ctx);
                  context.push('/property/${lead.propertyId}');
                },
              ),
            ],
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      color: lead.isRead ? null : AppColors.primaryContainer.withValues(alpha: 0.08),
      child: ListTile(
        contentPadding: const EdgeInsets.fromLTRB(14, 10, 4, 10),
        title: Row(
          children: [
            if (!lead.isRead)
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.only(right: 8),
                decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
              ),
            Expanded(child: Text(lead.subject, style: const TextStyle(fontWeight: FontWeight.w600))),
            Text(timeAgo(lead.createdAt), style: const TextStyle(fontSize: 11, color: AppColors.outline)),
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
        onTap: () => _open(context, ref),
        trailing: PopupMenuButton<String>(
          onSelected: (v) => v == 'read' ? _markRead(context, ref) : _delete(context, ref),
          itemBuilder: (_) => [
            if (!lead.isRead) PopupMenuItem(value: 'read', child: Text('dashboard.markRead'.tr())),
            PopupMenuItem(
              value: 'delete',
              child: Text('common.delete'.tr(), style: const TextStyle(color: AppColors.error)),
            ),
          ],
        ),
      ),
    );
  }
}
