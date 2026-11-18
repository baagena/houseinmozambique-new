import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/json.dart';
import '../../repositories/admin_repository.dart';
import '../../widgets/dashboard_ui.dart';
import '../../widgets/error_view.dart';
import '../../widgets/shimmer_loaders.dart';
import '../../widgets/sheets.dart';

/// The leads ledger — web: dashboard/admin/leads.
class AdminLeadsScreen extends ConsumerStatefulWidget {
  const AdminLeadsScreen({super.key});

  @override
  ConsumerState<AdminLeadsScreen> createState() => _AdminLeadsScreenState();
}

class _AdminLeadsScreenState extends ConsumerState<AdminLeadsScreen> {
  String _filter = 'all'; // all | unanswered | unread

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(adminLeadsProvider);
    return Scaffold(
      appBar: AppBar(title: Text('dash.adminLeads'.tr())),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(adminLeadsProvider.future),
        child: async.when(
          loading: () => const ListSkeleton(),
          error: (e, _) => ErrorView(message: e.asApiException?.message, onRetry: () => ref.invalidate(adminLeadsProvider)),
          data: (data) {
            final stats = data.obj('stats');
            final all = data.objList('leads');
            final leads = all.where((l) {
              if (_filter == 'unanswered') return l.strOrNull('repliedAt') == null;
              if (_filter == 'unread') return !l.flag('isRead');
              return true;
            }).toList();
            final median = stats.number('medianMinutes');
            final rate = stats.number('contactRate');
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                StatGrid(tiles: [
                  StatTile(label: 'dash.last30Days'.tr(), value: '${stats.integer('last30')}', icon: Icons.inbox_outlined),
                  StatTile(
                    label: 'dash.medianResponse'.tr(),
                    value: median == null ? '—' : _duration(median),
                    icon: Icons.timer_outlined,
                  ),
                  StatTile(
                    label: 'dash.unansweredDay'.tr(),
                    value: '${stats.integer('unansweredPastDay')}',
                    icon: Icons.schedule,
                    color: stats.integer('unansweredPastDay') > 0 ? AppColors.error : null,
                  ),
                  StatTile(
                    label: 'dash.contactRate'.tr(),
                    value: rate == null ? '—' : '${rate.toStringAsFixed(1)}%',
                    icon: Icons.touch_app_outlined,
                  ),
                ]),
                const SizedBox(height: 12),
                Wrap(spacing: 8, children: [
                  for (final f in const ['all', 'unanswered', 'unread'])
                    ChoiceChip(
                      label: Text('dash.filter_$f'.tr()),
                      selected: _filter == f,
                      onSelected: (_) => setState(() => _filter = f),
                    ),
                ]),
                const SizedBox(height: 8),
                if (leads.isEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 40),
                    child: EmptyView(icon: Icons.inbox_outlined, title: 'dashboard.noLeads'.tr()),
                  ),
                ...leads.map((l) => _AdminLeadTile(lead: l)),
              ],
            );
          },
        ),
      ),
    );
  }

  static String _duration(double minutes) {
    if (minutes < 60) return '${minutes.round()}m';
    if (minutes < 60 * 24) return '${(minutes / 60).toStringAsFixed(1)}h';
    return '${(minutes / 1440).toStringAsFixed(1)}d';
  }
}

class _AdminLeadTile extends ConsumerWidget {
  final Map<String, dynamic> lead;
  const _AdminLeadTile({required this.lead});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = lead;
    final replied = l.strOrNull('repliedAt') != null;
    return Card(
      margin: const EdgeInsets.only(top: 10),
      color: l.flag('isRead') ? null : AppColors.primaryContainer.withValues(alpha: 0.08),
      child: ListTile(
        title: Text(l.str('subject'), maxLines: 1, overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(
          [
            '${l.str('name')} · ${l.str('email')}',
            if (l.strOrNull('listing') != null) l.str('listing'),
            if (l.strOrNull('agent') != null) 'admin.listedBy'.tr(args: [l.str('agent')]),
          ].join('\n'),
          style: const TextStyle(fontSize: 12),
        ),
        isThreeLine: true,
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(timeAgo(l.date('createdAt')), style: const TextStyle(fontSize: 11, color: AppColors.outline)),
            const SizedBox(height: 4),
            Icon(replied ? Icons.mark_email_read : Icons.mark_email_unread_outlined,
                size: 18, color: replied ? Colors.green : AppColors.outline),
          ],
        ),
        onTap: () async {
          if (!l.flag('isRead')) {
            // Best effort: opening a lead counts as reading it, as on the web.
            final repo = ref.read(adminRepositoryProvider);
            () async {
              try {
                await repo.markLeadRead(l.str('id'));
              } catch (_) {}
            }();
          }
          final sent = await showModalBottomSheet<bool>(
            context: context,
            isScrollControlled: true,
            showDragHandle: true,
            builder: (_) => _ReplySheet(lead: l),
          );
          ref.invalidate(adminLeadsProvider);
          ref.invalidate(adminOverviewProvider);
          if (sent == true && context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('dash.replySent'.tr())));
          }
        },
      ),
    );
  }
}

class _ReplySheet extends ConsumerStatefulWidget {
  final Map<String, dynamic> lead;
  const _ReplySheet({required this.lead});

  @override
  ConsumerState<_ReplySheet> createState() => _ReplySheetState();
}

class _ReplySheetState extends ConsumerState<_ReplySheet> {
  late final _subject = TextEditingController(text: 'Re: ${widget.lead.str('subject')}');
  final _body = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _subject.dispose();
    _body.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (_body.text.trim().isEmpty) {
      setState(() => _error = 'common.required'.tr());
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(adminRepositoryProvider).replyToLead(
            widget.lead.str('id'),
            body: _body.text.trim(),
            subject: _subject.text.trim(),
          );
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = e.asApiException?.message ?? 'common.somethingWentWrong'.tr();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = widget.lead;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.of(context).viewInsets.bottom + 24),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SheetTitle(l.str('subject')),
            InfoRow('admin.fullName'.tr(), l.str('name')),
            InfoRow('admin.email'.tr(), l.str('email'), copyable: true),
            InfoRow('dash.received'.tr(), formatDateTime(l.date('createdAt'))),
            if (l.strOrNull('listing') != null) InfoRow('dash.listing'.tr(), l.str('listing')),
            if (l.strOrNull('repliedAt') != null) InfoRow('dash.repliedOn'.tr(), formatDateTime(l.date('repliedAt'))),
            const Divider(height: 24),
            SelectableText(l.str('message'), style: const TextStyle(height: 1.4)),
            const Divider(height: 24),
            TextField(controller: _subject, enabled: !_busy, decoration: InputDecoration(labelText: 'contact.subject'.tr())),
            const SizedBox(height: 10),
            TextField(
              controller: _body,
              enabled: !_busy,
              minLines: 4,
              maxLines: 8,
              decoration: InputDecoration(labelText: 'dash.yourReply'.tr(), errorText: _error),
            ),
            const SizedBox(height: 14),
            ElevatedButton.icon(
              onPressed: _busy ? null : _send,
              icon: const Icon(Icons.send, size: 18),
              label: _busy
                  ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text('dash.sendReply'.tr()),
            ),
          ],
        ),
      ),
    );
  }
}
