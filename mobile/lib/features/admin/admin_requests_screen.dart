import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/json.dart';
import '../../core/utils/labels.dart';
import '../../repositories/admin_repository.dart';
import '../../widgets/dashboard_ui.dart';
import '../../widgets/error_view.dart';
import '../../widgets/shimmer_loaders.dart';
import '../../widgets/status_badge.dart';
import '../agent_dashboard/agent_requests_screen.dart' show budgetLine;

/// Buyer requests waiting on a decision — web: dashboard/admin/requests.
class AdminRequestsScreen extends ConsumerWidget {
  const AdminRequestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(adminRequestsProvider);
    return Scaffold(
      appBar: AppBar(title: Text('dash.propertyRequests'.tr())),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(adminRequestsProvider.future),
        child: async.when(
          loading: () => const ListSkeleton(),
          error: (e, _) => ErrorView(message: e.asApiException?.message, onRetry: () => ref.invalidate(adminRequestsProvider)),
          data: (data) {
            final requests = data.objList('requests');
            final reach = data.integer('paidAgentCount');
            if (requests.isEmpty) {
              return ListView(children: [
                const SizedBox(height: 80),
                EmptyView(icon: Icons.person_search_outlined, title: 'dash.noRequests'.tr()),
              ]);
            }
            return ListView(
              padding: const EdgeInsets.all(16),
              children: requests.map((r) => _AdminRequestCard(request: r, reach: reach)).toList(),
            );
          },
        ),
      ),
    );
  }
}

class _AdminRequestCard extends ConsumerWidget {
  final Map<String, dynamic> request;
  final int reach;
  const _AdminRequestCard({required this.request, required this.reach});

  Future<void> _decide(BuildContext context, WidgetRef ref, String action) async {
    String note = '';
    if (action == 'reject') {
      final v = await promptText(context, title: 'common.reject'.tr(), label: 'dash.reason'.tr(), required: true,
          confirmLabel: 'common.reject'.tr());
      if (v == null) return;
      note = v;
    } else {
      final ok = await confirmDialog(
        context,
        title: action == 'release' ? 'dash.releaseRequest'.tr() : 'dash.closeRequest'.tr(),
        body: action == 'release' ? 'dash.releaseBody'.tr(args: ['$reach']) : null,
      );
      if (!ok) return;
    }
    if (!context.mounted) return;
    if (await runAction(
      context,
      () => ref.read(adminRepositoryProvider).decideRequest(request.str('id'), action, note: note),
      success: 'dash.listingUpdated'.tr(),
    )) {
      ref.invalidate(adminRequestsProvider);
      ref.invalidate(adminOverviewProvider);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final r = request;
    final status = r.str('status');
    final budget = budgetLine(r);
    final canRelease = status == 'PENDING' && r.strOrNull('broadcastAt') == null;
    final isOpen = const ['PENDING', 'OPEN', 'MATCHED'].contains(status);
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(
                child: Text('${listingTypeLabel(r.str('intent'))} · ${r.str('city')}',
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              ),
              StatusBadge(status: status),
            ]),
            const SizedBox(height: 4),
            Text(
              [
                r.str('ref'),
                if (r.str('propertyType').isNotEmpty) propertyTypeLabel(r.str('propertyType')),
                if (budget.isNotEmpty) budget,
                if (r.integerOrNull('minBeds') != null) 'dash.minBeds'.tr(args: ['${r.integer('minBeds')}']),
              ].join(' · '),
              style: const TextStyle(fontSize: 13),
            ),
            if (r.joined('areas').isNotEmpty) Text(r.joined('areas'), style: const TextStyle(fontSize: 13)),
            if (r.str('notes').isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(r.str('notes'), style: const TextStyle(fontSize: 13, fontStyle: FontStyle.italic)),
            ],
            const Divider(height: 20),
            InfoRow('admin.fullName'.tr(), r.str('name') + (r.flag('anonymous') ? ' (${'dash.anonymous'.tr()})' : '')),
            InfoRow('admin.email'.tr(), r.str('email'), copyable: true),
            InfoRow('dash.phone'.tr(), r.str('phone'), copyable: true),
            InfoRow('dash.received'.tr(), formatDateTime(r.date('createdAt'))),
            if (r.strOrNull('broadcastAt') != null)
              InfoRow('dash.sentTo'.tr(), 'dash.agentsCount'.tr(args: ['${r.integer('broadcastTo')}'])),
            InfoRow('dash.responsesLabel'.tr(), '${r.integer('responseCount')}'),
            if (r.str('reviewNote').isNotEmpty) InfoRow('dash.note'.tr(), r.str('reviewNote')),
            if (isOpen) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 4,
                alignment: WrapAlignment.end,
                children: [
                  if (canRelease)
                    ElevatedButton(onPressed: () => _decide(context, ref, 'release'), child: Text('dash.release'.tr())),
                  if (status == 'PENDING')
                    OutlinedButton(
                      onPressed: () => _decide(context, ref, 'reject'),
                      style: OutlinedButton.styleFrom(foregroundColor: AppColors.error),
                      child: Text('common.reject'.tr()),
                    ),
                  TextButton(onPressed: () => _decide(context, ref, 'close'), child: Text('common.close'.tr())),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
