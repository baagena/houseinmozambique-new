import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/json.dart';
import '../../core/utils/labels.dart';
import '../../core/utils/store_policy.dart';
import '../../repositories/agent_dashboard_repository.dart';
import '../../widgets/dashboard_ui.dart';
import '../../widgets/error_view.dart';
import '../../widgets/shimmer_loaders.dart';
import '../../widgets/sheets.dart';

String budgetLine(Map<String, dynamic> r) {
  final min = r.integerOrNull('budgetMinMinor');
  final max = r.integerOrNull('budgetMaxMinor');
  final cur = r.str('currency', 'MZN');
  if (min == null && max == null) return '';
  if (min != null && max != null) return '${formatMinor(min, cur)} – ${formatMinor(max, cur)}';
  return min != null ? '≥ ${formatMinor(min, cur)}' : '≤ ${formatMinor(max!, cur)}';
}

/// "Buyers looking" — web: dashboard/agent/requests.
class AgentRequestsScreen extends ConsumerWidget {
  const AgentRequestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(agentRequestsProvider);
    return Scaffold(
      appBar: AppBar(title: Text('dash.buyersLooking'.tr())),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(agentRequestsProvider.future),
        child: async.when(
          loading: () => const ListSkeleton(),
          error: (e, _) => ErrorView(
            message: e.asApiException?.message,
            onRetry: () => ref.invalidate(agentRequestsProvider),
          ),
          data: (data) {
            final requests = data.objList('requests');
            final paid = data.flag('paid');
            final delay = data.integer('delayHours', 24);
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text('dash.buyersLookingIntro'.tr(), style: const TextStyle(color: AppColors.onSurfaceVariant)),
                // Never on iOS: a paid tier that unlocks requests sooner is an
                // in-app upsell Apple does not allow (store_policy.dart).
                if (!paid && showsPaidPlans) ...[
                  const SizedBox(height: 12),
                  NoticeCard(
                    icon: Icons.schedule,
                    text: 'dash.freeTierDelay'.tr(args: ['$delay']),
                    action: TextButton(
                      onPressed: () => context.push('/dashboard/billing'),
                      child: Text('dash.seePlans'.tr()),
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                if (requests.isEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 60),
                    child: EmptyView(icon: Icons.person_search_outlined, title: 'dash.noRequests'.tr()),
                  ),
                ...requests.map((r) => _RequestCard(request: r)),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _RequestCard extends ConsumerWidget {
  final Map<String, dynamic> request;
  const _RequestCard({required this.request});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final r = request;
    final answered = r.flag('answered');
    final areas = r.joined('areas');
    final budget = budgetLine(r);
    final facts = [
      if (r.str('propertyType').isNotEmpty) propertyTypeLabel(r.str('propertyType')),
      if (r.integerOrNull('minBeds') != null) 'dash.minBeds'.tr(args: ['${r.integer('minBeds')}']),
      if (budget.isNotEmpty) budget,
    ];
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    '${listingTypeLabel(r.str('intent'))} · ${r.str('city')}',
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                ),
                Text(r.str('ref'), style: const TextStyle(fontSize: 11, color: AppColors.outline)),
              ],
            ),
            if (areas.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(areas, style: const TextStyle(color: AppColors.onSurfaceVariant)),
            ],
            if (facts.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(facts.join(' · '), style: const TextStyle(fontSize: 13)),
            ],
            if (r.date('moveBy') != null)
              Text('dash.moveBy'.tr(args: [formatDate(r.date('moveBy'))]), style: const TextStyle(fontSize: 13)),
            if (r.str('notes').isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(r.str('notes'), style: const TextStyle(fontSize: 13, fontStyle: FontStyle.italic)),
            ],
            const SizedBox(height: 6),
            Text(
              '${'dash.postedAgo'.tr(args: [timeAgo(r.date('createdAt'))])} · ${'dash.responses'.tr(args: ['${r.integer('responseCount')}'])}',
              style: const TextStyle(fontSize: 11.5, color: AppColors.outline),
            ),
            if (r.strOrNull('email') != null || r.strOrNull('phone') != null) ...[
              const Divider(height: 20),
              if (r.strOrNull('name') != null) InfoRow('admin.fullName'.tr(), r.str('name')),
              if (r.strOrNull('email') != null) InfoRow('admin.email'.tr(), r.str('email'), copyable: true),
              if (r.strOrNull('phone') != null) InfoRow('dash.phone'.tr(), r.str('phone'), copyable: true),
              Wrap(spacing: 8, children: [
                if (r.strOrNull('phone') != null)
                  TextButton.icon(
                    icon: const Icon(Icons.call, size: 18),
                    label: Text('dash.channelCall'.tr()),
                    onPressed: () => launchUrl(Uri(scheme: 'tel', path: r.str('phone'))),
                  ),
                if (r.strOrNull('email') != null)
                  TextButton.icon(
                    icon: const Icon(Icons.email_outlined, size: 18),
                    label: const Text('Email'),
                    onPressed: () => launchUrl(Uri(scheme: 'mailto', path: r.str('email'))),
                  ),
              ]),
            ] else if (r.flag('anonymous')) ...[
              const SizedBox(height: 6),
              Text('dash.contactAfterRespond'.tr(), style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
            ],
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: answered
                  ? OutlinedButton.icon(
                      icon: const Icon(Icons.edit_outlined, size: 18),
                      label: Text('dash.editResponse'.tr()),
                      onPressed: () => _respond(context, ref),
                    )
                  : ElevatedButton.icon(
                      icon: const Icon(Icons.send, size: 18),
                      label: Text('dash.respond'.tr()),
                      onPressed: () => _respond(context, ref),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _respond(BuildContext context, WidgetRef ref) async {
    final sent = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _RespondSheet(requestId: request.str('id')),
    );
    if (sent == true) ref.invalidate(agentRequestsProvider);
  }
}

class _RespondSheet extends ConsumerStatefulWidget {
  final String requestId;
  const _RespondSheet({required this.requestId});

  @override
  ConsumerState<_RespondSheet> createState() => _RespondSheetState();
}

class _RespondSheetState extends ConsumerState<_RespondSheet> {
  final _message = TextEditingController();
  String? _propertyId;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _message.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref
          .read(agentDashboardRepositoryProvider)
          .respondToRequest(widget.requestId, message: _message.text.trim(), propertyId: _propertyId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('dash.responseSent'.tr())));
      Navigator.pop(context, true);
    } catch (e) {
      final api = e.asApiException;
      if (!mounted) return;
      setState(() {
        _busy = false;
        // The server's 403 text suggests upgrading; iOS must not.
        _error = api?.statusCode == 403 && !showsPaidPlans
            ? 'dash.requestNotOpenYet'.tr()
            : api?.message ?? 'common.somethingWentWrong'.tr();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final listings = ref.watch(myPropertiesProvider).asData?.value
            .where((p) => p.status.toUpperCase() == 'PUBLISHED')
            .toList() ??
        const [];
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.of(context).viewInsets.bottom + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SheetTitle('dash.respond'.tr()),
          TextField(
            controller: _message,
            enabled: !_busy,
            minLines: 3,
            maxLines: 6,
            maxLength: 1000,
            decoration: InputDecoration(labelText: 'dash.respondMessage'.tr()),
          ),
          if (listings.isNotEmpty) ...[
            const SizedBox(height: 8),
            DropdownButtonFormField<String?>(
              initialValue: _propertyId,
              isExpanded: true,
              decoration: InputDecoration(labelText: 'common.optional'.tr(args: ['dash.suggestListing'.tr()])),
              items: [
                DropdownMenuItem<String?>(value: null, child: Text('dash.noListing'.tr())),
                ...listings.map((p) => DropdownMenuItem<String?>(
                      value: p.id,
                      child: Text(p.localizedTitle(Localizations.localeOf(context).languageCode), overflow: TextOverflow.ellipsis),
                    )),
              ],
              onChanged: _busy ? null : (v) => setState(() => _propertyId = v),
            ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(_error!, style: const TextStyle(color: AppColors.error)),
          ],
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _busy ? null : _send,
            child: _busy
                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : Text('common.send'.tr()),
          ),
        ],
      ),
    );
  }
}
