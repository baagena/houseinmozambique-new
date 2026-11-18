import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/store_policy.dart';
import '../../core/utils/json.dart';
import '../../repositories/admin_repository.dart';
import '../../widgets/dashboard_ui.dart';
import '../../widgets/error_view.dart';
import '../../widgets/shimmer_loaders.dart';
import '../../widgets/status_badge.dart';

/// Payments waiting on a check — web: dashboard/admin/payments/verify.
/// Never reachable on iOS (see store_policy.dart); the router redirects.
class AdminVerifyPaymentsScreen extends ConsumerWidget {
  const AdminVerifyPaymentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!showsPaidPlans) return const SizedBox.shrink();
    final async = ref.watch(adminVerifyQueueProvider);
    return Scaffold(
      appBar: AppBar(title: Text('dash.verifyPayments'.tr())),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(adminVerifyQueueProvider.future),
        child: async.when(
          loading: () => const ListSkeleton(),
          error: (e, _) =>
              ErrorView(message: e.asApiException?.message, onRetry: () => ref.invalidate(adminVerifyQueueProvider)),
          data: (data) {
            final payments = data.objList('payments');
            // Submitted proofs are the work; references nobody has paid yet come after.
            payments.sort((a, b) => (a.str('status') == 'SUBMITTED' ? 0 : 1) - (b.str('status') == 'SUBMITTED' ? 0 : 1));
            if (payments.isEmpty) {
              return ListView(children: [
                const SizedBox(height: 80),
                EmptyView(icon: Icons.verified_outlined, title: 'admin.allCaughtUp'.tr()),
              ]);
            }
            return ListView(
              padding: const EdgeInsets.all(16),
              children: payments.map((p) => _VerifyCard(payment: p)).toList(),
            );
          },
        ),
      ),
    );
  }
}

class _VerifyCard extends ConsumerWidget {
  final Map<String, dynamic> payment;
  const _VerifyCard({required this.payment});

  Future<void> _approve(BuildContext context, WidgetRef ref) async {
    final p = payment;
    final expected = p.integer('amountMinor');
    final received = await promptText(
      context,
      title: 'dash.approvePayment'.tr(),
      label: 'dash.amountReceived'.tr(args: [p.str('currency', 'MZN')]),
      initial: (expected / 100).toStringAsFixed(expected % 100 == 0 ? 0 : 2),
      maxLines: 1,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      confirmLabel: 'common.approve'.tr(),
    );
    if (received == null || !context.mounted) return;
    final major = double.tryParse(received.replaceAll(',', '.'));
    final minor = major == null ? null : (major * 100).round();
    if (await runAction(
      context,
      () => ref.read(adminRepositoryProvider).verifyPayment(p.str('id'), 'approve', receivedMinor: minor),
      success: 'dash.paymentApproved'.tr(),
    )) {
      ref.invalidate(adminVerifyQueueProvider);
      ref.invalidate(adminOverviewProvider);
    }
  }

  Future<void> _reject(BuildContext context, WidgetRef ref) async {
    final note = await promptText(context,
        title: 'common.reject'.tr(), label: 'dash.rejectReason'.tr(), required: true, confirmLabel: 'common.reject'.tr());
    if (note == null || !context.mounted) return;
    if (await runAction(
      context,
      () => ref.read(adminRepositoryProvider).verifyPayment(payment.str('id'), 'reject', note: note),
      success: 'dash.paymentRejectedDone'.tr(),
    )) {
      ref.invalidate(adminVerifyQueueProvider);
      ref.invalidate(adminOverviewProvider);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final p = payment;
    final currency = p.str('currency', 'MZN');
    final planPrice = p.integerOrNull('planPriceMinor');
    final proof = p.strOrNull('proofUrl');
    final status = p.str('status');
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(
                child: Text(p.strOrNull('planName') ?? p.str('planType'),
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              ),
              StatusBadge(status: status),
            ]),
            const SizedBox(height: 6),
            InfoRow('dash.reference'.tr(), p.str('orderRef'), copyable: true),
            InfoRow('dashboard.amount'.tr(), formatMinor(p.integer('amountMinor'), currency)),
            if (planPrice != null && planPrice != p.integer('amountMinor'))
              InfoRow('dash.planPriceNow'.tr(), formatMinor(planPrice, currency)),
            InfoRow('admin.fullName'.tr(), p.str('customerName')),
            InfoRow('admin.email'.tr(), p.str('customerEmail'), copyable: true),
            InfoRow('dash.phone'.tr(), p.str('customerPhone')),
            InfoRow('dashboard.transactionRef'.tr(), p.str('payerReference'), copyable: true),
            InfoRow('dash.paidFromNumber'.tr(), p.str('payerMsisdn')),
            InfoRow('dash.note'.tr(), p.str('proofNote')),
            InfoRow('dash.submitted'.tr(),
                p.date('submittedAt') == null ? '' : formatDateTime(p.date('submittedAt'))),
            InfoRow('dash.created'.tr(), formatDateTime(p.date('createdAt'))),
            if (p.str('reviewNote').isNotEmpty) InfoRow('dash.reviewNote'.tr(), p.str('reviewNote')),
            if (proof != null) ...[
              const SizedBox(height: 8),
              GestureDetector(
                onTap: () => showDialog<void>(
                  context: context,
                  builder: (_) => Dialog(child: InteractiveViewer(child: CachedNetworkImage(imageUrl: proof))),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: CachedNetworkImage(imageUrl: proof, height: 160, width: double.infinity, fit: BoxFit.cover),
                ),
              ),
            ],
            if (status == 'PENDING')
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text('dash.noProofYet'.tr(), style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
              ),
            const SizedBox(height: 10),
            Row(
              children: [
                if (status != 'REJECTED') ...[
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _reject(context, ref),
                      style: OutlinedButton.styleFrom(foregroundColor: AppColors.error),
                      child: Text('common.reject'.tr(), maxLines: 1, overflow: TextOverflow.ellipsis),
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => _approve(context, ref),
                    child: Text('common.approve'.tr(), maxLines: 1, overflow: TextOverflow.ellipsis),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Every payment, read-only — web: dashboard/admin/payments.
class AdminPaymentsLedgerScreen extends ConsumerStatefulWidget {
  const AdminPaymentsLedgerScreen({super.key});

  @override
  ConsumerState<AdminPaymentsLedgerScreen> createState() => _AdminPaymentsLedgerScreenState();
}

class _AdminPaymentsLedgerScreenState extends ConsumerState<AdminPaymentsLedgerScreen> {
  String _status = 'all';
  String _query = '';
  final _search = TextEditingController();
  late Future<Map<String, dynamic>> _future = _load();

  Future<Map<String, dynamic>> _load() => ref.read(adminRepositoryProvider).getLedger(status: _status, q: _query);

  void _reload() {
    setState(() {
      _future = _load();
    });
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!showsPaidPlans) return const SizedBox.shrink();
    return Scaffold(
      appBar: AppBar(title: Text('dash.paymentsLedger'.tr())),
      body: RefreshIndicator(
        onRefresh: () async {
          _reload();
          await _future.catchError((_) => <String, dynamic>{});
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextField(
              controller: _search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search),
                hintText: 'dash.searchPayments'.tr(),
              ),
              onSubmitted: (v) {
                _query = v.trim();
                _reload();
              },
            ),
            const SizedBox(height: 10),
            Wrap(spacing: 8, children: [
              for (final s in const ['all', 'pending', 'completed', 'rejected'])
                ChoiceChip(
                  label: Text('dash.ledger_$s'.tr()),
                  selected: _status == s,
                  onSelected: (_) {
                    _status = s;
                    _reload();
                  },
                ),
            ]),
            const SizedBox(height: 12),
            FutureBuilder<Map<String, dynamic>>(
              future: _future,
              builder: (context, snap) {
                if (snap.connectionState != ConnectionState.done) {
                  return const Padding(padding: EdgeInsets.all(32), child: Center(child: CircularProgressIndicator()));
                }
                if (snap.hasError) {
                  return ErrorView(message: snap.error.asApiException?.message, onRetry: _reload);
                }
                final data = snap.data ?? const <String, dynamic>{};
                final totals = data.obj('totals');
                final payments = data.objList('payments');
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    StatGrid(tiles: [
                      StatTile(
                        label: 'dash.collected'.tr(),
                        value: formatMinor(totals.integer('completedMinor')),
                        icon: Icons.account_balance_wallet_outlined,
                      ),
                      StatTile(
                        label: 'dash.completedPayments'.tr(),
                        value: '${totals.integer('completedCount')}',
                        icon: Icons.check_circle_outline,
                      ),
                    ]),
                    const SizedBox(height: 8),
                    if (payments.isEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 40),
                        child: EmptyView(icon: Icons.receipt_long_outlined, title: 'common.noResults'.tr()),
                      ),
                    ...payments.map((p) => Card(
                          margin: const EdgeInsets.only(top: 8),
                          child: ListTile(
                            title: Text(p.strOrNull('planName') ?? p.str('planType'),
                                style: const TextStyle(fontWeight: FontWeight.w600)),
                            subtitle: Text(
                              '${p.str('customerName')} · ${p.str('customerEmail')}\n${p.str('orderRef')} · ${formatDate(p.date('createdAt'))}',
                              style: const TextStyle(fontSize: 12),
                            ),
                            isThreeLine: true,
                            trailing: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(formatMinor(p.integer('amountMinor'), p.str('currency', 'MZN')),
                                    style: const TextStyle(fontWeight: FontWeight.w600)),
                                const SizedBox(height: 4),
                                StatusBadge(status: p.str('status')),
                              ],
                            ),
                          ),
                        )),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
