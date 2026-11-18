import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/json.dart';
import '../../core/utils/store_policy.dart';
import '../../repositories/agent_dashboard_repository.dart';
import '../../widgets/dashboard_ui.dart';
import '../../widgets/error_view.dart';
import '../../widgets/shimmer_loaders.dart';
import '../../widgets/status_badge.dart';

/// Plan, usage, open payment and history — web: dashboard/agent/billing.
/// Never reachable on iOS (see store_policy.dart); the router redirects.
class AgentBillingScreen extends ConsumerWidget {
  const AgentBillingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!showsPaidPlans) return const SizedBox.shrink();
    final async = ref.watch(agentBillingProvider);
    final pt = Localizations.localeOf(context).languageCode == 'pt';

    return Scaffold(
      appBar: AppBar(title: Text('dash.billing'.tr())),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(agentBillingProvider.future),
        child: async.when(
          loading: () => const ListSkeleton(),
          error: (e, _) => ErrorView(
            message: e.asApiException?.message,
            onRetry: () => ref.invalidate(agentBillingProvider),
          ),
          data: (data) {
            final state = data.obj('state');
            final open = data.objOrNull('openPayment');
            final plans = data.objList('plans');
            final payments = data.objList('payments');
            final credits = data.objList('credits');
            final quota = state.integer('quota', 1);
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // ── Current plan ──
                Card(
                  margin: EdgeInsets.zero,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('dash.currentPlan'.tr(), style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                        const SizedBox(height: 4),
                        Text(state.strOrNull('planName') ?? 'dash.noPlan'.tr(),
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 10),
                        InfoRow('dash.listingsUsed'.tr(),
                            quota < 0 ? '${state.integer('used')} / ∞' : '${state.integer('used')} / $quota'),
                        InfoRow('dash.credits'.tr(), '${state.integer('credits')}'),
                        if (state.date('periodEnd') != null)
                          InfoRow('dash.renewsOn'.tr(), formatDate(state.date('periodEnd'))),
                        if (state.flag('inGrace'))
                          Padding(
                            padding: const EdgeInsets.only(top: 6),
                            child: Text('dash.inGrace'.tr(args: ['${data.integer('graceDays')}']),
                                style: const TextStyle(color: AppColors.error, fontSize: 13)),
                          ),
                        if (!state.flag('canPublish', true))
                          Padding(
                            padding: const EdgeInsets.only(top: 6),
                            child: Text('dash.quotaFull'.tr(),
                                style: const TextStyle(color: AppColors.secondary, fontSize: 13)),
                          ),
                      ],
                    ),
                  ),
                ),

                // ── The payment that still needs something ──
                if (open != null) ...[
                  SectionTitle('dash.openPayment'.tr(), trailing: StatusBadge(status: open.str('status'))),
                  if (open.str('status') == 'SUBMITTED')
                    NoticeCard(
                      icon: Icons.hourglass_top,
                      text: 'dash.proofUnderReview'.tr(args: [open.str('orderRef')]),
                    )
                  else ...[
                    if (open.str('status') == 'REJECTED' && open.str('reviewNote').isNotEmpty) ...[
                      NoticeCard(
                        icon: Icons.error_outline,
                        color: AppColors.error,
                        text: 'dash.paymentRejected'.tr(args: [open.str('reviewNote')]),
                      ),
                      const SizedBox(height: 12),
                    ],
                    Text(open.strOrNull('planName') ?? open.str('planType'),
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    PaymentInstructionsCard(
                      instructions: data.obj('instructions'),
                      orderRef: open.str('orderRef'),
                      amountMinor: open.integer('amountMinor'),
                      currency: open.str('currency', 'MZN'),
                    ),
                    const SizedBox(height: 12),
                    PaymentProofForm(
                      paymentId: open.str('id'),
                      onSubmitted: () => ref.invalidate(agentBillingProvider),
                    ),
                  ],
                ],

                // ── Plans ──
                SectionTitle('dashboard.selectPlanTitle'.tr()),
                ...plans.map((p) => _PlanCard(plan: p, pt: pt, current: state.str('planSlug') == p.str('slug'))),

                if (credits.isNotEmpty) ...[
                  SectionTitle('dash.credits'.tr()),
                  ...credits.map((c) => ListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        title: Text(c.str('planName')),
                        subtitle: Text(c.date('expiresAt') == null
                            ? formatDate(c.date('createdAt'))
                            : 'dash.expires'.tr(args: [formatDate(c.date('expiresAt'))])),
                        trailing: StatusBadge(status: c.str('status')),
                      )),
                ],

                if (payments.isNotEmpty) ...[
                  SectionTitle('dash.paymentHistory'.tr()),
                  ...payments.map((p) => ListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        title: Text((pt ? p.strOrNull('planName') : p.strOrNull('planNameEn')) ?? p.str('planType')),
                        subtitle: Text('${p.str('orderRef')} · ${formatDate(p.date('createdAt'))}'),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(formatMinor(p.integer('amountMinor'), p.str('currency', 'MZN')),
                                style: const TextStyle(fontWeight: FontWeight.w600)),
                            const SizedBox(height: 2),
                            StatusBadge(status: p.str('status')),
                          ],
                        ),
                      )),
                ],
              ],
            );
          },
        ),
      ),
    );
  }
}

class _PlanCard extends ConsumerStatefulWidget {
  final Map<String, dynamic> plan;
  final bool pt;
  final bool current;
  const _PlanCard({required this.plan, required this.pt, required this.current});

  @override
  ConsumerState<_PlanCard> createState() => _PlanCardState();
}

class _PlanCardState extends ConsumerState<_PlanCard> {
  bool _busy = false;

  Future<void> _choose() async {
    final p = widget.plan;
    final name = widget.pt ? p.str('namePt') : p.str('nameEn');
    if (p.str('ctaMode') == 'contact') {
      context.push('/contact', extra: {'subject': 'dash.planEnquiry'.tr(args: [name])});
      return;
    }
    final ok = await confirmDialog(
      context,
      title: name,
      body: 'dash.choosePlanBody'.tr(args: [formatMinor(p.integer('priceMinor'), p.str('currency', 'MZN'))]),
    );
    if (!ok || !mounted) return;
    setState(() => _busy = true);
    await runAction(context, () => ref.read(agentDashboardRepositoryProvider).choosePlan(p.str('slug')));
    if (!mounted) return;
    setState(() => _busy = false);
    ref.invalidate(agentBillingProvider);
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.plan;
    final price = p.integer('priceMinor');
    final quota = p.integer('listingQuota', 1);
    final interval = p.strOrNull('interval');
    final desc = widget.pt ? p.str('descriptionPt') : p.str('descriptionEn');
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: p.flag('highlighted') ? AppColors.secondary : Colors.transparent,
          width: 1.5,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(widget.pt ? p.str('namePt') : p.str('nameEn'),
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                  price == 0
                      ? 'plans.standardPrice'.tr()
                      : '${formatMinor(price, p.str('currency', 'MZN'))}${interval == 'month' ? ' / ${'dash.month'.tr()}' : interval == 'year' ? ' / ${'dash.year'.tr()}' : ''}',
                  textAlign: TextAlign.end,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
            if (desc.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(desc, style: const TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant)),
            ],
            const SizedBox(height: 4),
            Text(
              quota < 0 ? 'dash.unlimitedListings'.tr() : 'dash.listingsQuota'.tr(args: ['$quota']),
              style: const TextStyle(fontSize: 12.5),
            ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: widget.current
                  ? Chip(label: Text('dash.currentPlan'.tr()))
                  : price == 0
                      ? const SizedBox.shrink()
                      : ElevatedButton(
                          onPressed: _busy ? null : _choose,
                          child: _busy
                              ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
                              : Text(p.str('ctaMode') == 'contact' ? 'dash.contactUs'.tr() : 'dash.choose'.tr()),
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
