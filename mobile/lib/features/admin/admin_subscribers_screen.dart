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

/// Newsletter subscribers — web: dashboard/admin/subscribers.
class AdminSubscribersScreen extends ConsumerWidget {
  const AdminSubscribersScreen({super.key});

  Future<void> _add(BuildContext context, WidgetRef ref) async {
    final email = await promptText(context,
        title: 'dash.addSubscriber'.tr(), label: 'admin.email'.tr(), required: true, maxLines: 1,
        keyboardType: TextInputType.emailAddress);
    if (email == null || !context.mounted) return;
    if (await runAction(context, () => ref.read(adminRepositoryProvider).addSubscriber(email),
        success: 'dash.subscriberAdded'.tr())) {
      ref.invalidate(adminSubscribersProvider);
    }
  }

  Future<void> _broadcast(BuildContext context, WidgetRef ref, int active) async {
    final sent = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _BroadcastSheet(activeCount: active),
    );
    if (sent == true) ref.invalidate(adminSubscribersProvider);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(adminSubscribersProvider);
    final activeCount = async.asData?.value.where((s) => s.flag('isActive')).length ?? 0;
    return Scaffold(
      appBar: AppBar(
        title: Text('dash.subscribers'.tr()),
        actions: [
          IconButton(icon: const Icon(Icons.person_add_alt_1_outlined), onPressed: () => _add(context, ref)),
          IconButton(
            icon: const Icon(Icons.send_outlined),
            tooltip: 'dash.sendNewsletter'.tr(),
            onPressed: activeCount == 0 ? null : () => _broadcast(context, ref, activeCount),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(adminSubscribersProvider.future),
        child: async.when(
          loading: () => const ListSkeleton(),
          error: (e, _) =>
              ErrorView(message: e.asApiException?.message, onRetry: () => ref.invalidate(adminSubscribersProvider)),
          data: (subs) {
            if (subs.isEmpty) {
              return ListView(children: [
                const SizedBox(height: 80),
                EmptyView(icon: Icons.group_add_outlined, title: 'dash.noSubscribers'.tr()),
              ]);
            }
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text('dash.activeSubscribers'.tr(args: ['$activeCount', '${subs.length}']),
                    style: const TextStyle(color: AppColors.onSurfaceVariant)),
                const SizedBox(height: 8),
                ...subs.map((s) {
                  final active = s.flag('isActive');
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      title: Text(s.str('email'), style: TextStyle(color: active ? null : AppColors.outline)),
                      subtitle: Text(
                        '${s.str('source')} · ${formatDate(s.date('createdAt'))}',
                        style: const TextStyle(fontSize: 12),
                      ),
                      trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                        Switch(
                          value: active,
                          onChanged: (v) async {
                            if (await runAction(
                                context, () => ref.read(adminRepositoryProvider).setSubscriberActive(s.str('id'), v))) {
                              ref.invalidate(adminSubscribersProvider);
                            }
                          },
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline),
                          onPressed: () async {
                            final ok = await confirmDialog(context,
                                title: 'common.delete'.tr(), body: s.str('email'), confirmLabel: 'common.delete'.tr(), destructive: true);
                            if (!ok || !context.mounted) return;
                            if (await runAction(context, () => ref.read(adminRepositoryProvider).deleteSubscriber(s.str('id')))) {
                              ref.invalidate(adminSubscribersProvider);
                            }
                          },
                        ),
                      ]),
                    ),
                  );
                }),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _BroadcastSheet extends ConsumerStatefulWidget {
  final int activeCount;
  const _BroadcastSheet({required this.activeCount});

  @override
  ConsumerState<_BroadcastSheet> createState() => _BroadcastSheetState();
}

class _BroadcastSheetState extends ConsumerState<_BroadcastSheet> {
  final _subject = TextEditingController();
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
    if (_subject.text.trim().isEmpty || _body.text.trim().isEmpty) {
      setState(() => _error = 'common.required'.tr());
      return;
    }
    final ok = await confirmDialog(context,
        title: 'dash.sendNewsletter'.tr(), body: 'dash.sendToCount'.tr(args: ['${widget.activeCount}']));
    if (!ok || !mounted) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(adminRepositoryProvider).broadcast(subject: _subject.text.trim(), body: _body.text.trim());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('dash.newsletterSent'.tr())));
      Navigator.pop(context, true);
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
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.of(context).viewInsets.bottom + 24),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SheetTitle('dash.sendNewsletter'.tr()),
            TextField(controller: _subject, enabled: !_busy, decoration: InputDecoration(labelText: 'contact.subject'.tr())),
            const SizedBox(height: 10),
            TextField(
              controller: _body,
              enabled: !_busy,
              minLines: 5,
              maxLines: 10,
              decoration: InputDecoration(labelText: 'dash.message'.tr(), errorText: _error),
            ),
            const SizedBox(height: 14),
            ElevatedButton(
              onPressed: _busy ? null : _send,
              child: _busy
                  ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text('dash.sendToCount'.tr(args: ['${widget.activeCount}'])),
            ),
          ],
        ),
      ),
    );
  }
}
