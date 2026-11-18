import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/json.dart';
import '../../core/utils/store_policy.dart';
import '../../repositories/agent_dashboard_repository.dart';
import '../../widgets/dashboard_ui.dart';
import '../../widgets/error_view.dart';
import '../../widgets/shimmer_loaders.dart';
import '../../widgets/status_badge.dart';

/// Buy visibility for one listing — web: dashboard/agent/boost/[id].
/// Never reachable on iOS (see store_policy.dart); the router redirects.
class BoostListingScreen extends ConsumerStatefulWidget {
  final String propertyId;
  const BoostListingScreen({super.key, required this.propertyId});

  @override
  ConsumerState<BoostListingScreen> createState() => _BoostListingScreenState();
}

class _BoostListingScreenState extends ConsumerState<BoostListingScreen> {
  final _selected = <String>{};
  bool _busy = false;
  Map<String, dynamic>? _payment; // set once a boost is reserved

  Future<void> _buy() async {
    setState(() => _busy = true);
    try {
      final res = await ref.read(agentDashboardRepositoryProvider).buyBoost(widget.propertyId, _selected.toList());
      if (!mounted) return;
      setState(() => _payment = res);
      ref.invalidate(boostOffersProvider(widget.propertyId));
      ref.invalidate(agentBillingProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.asApiException?.message ?? 'common.somethingWentWrong'.tr()),
          backgroundColor: AppColors.error,
        ));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!showsPaidPlans) return const SizedBox.shrink();
    final pt = Localizations.localeOf(context).languageCode == 'pt';
    final async = ref.watch(boostOffersProvider(widget.propertyId));
    return Scaffold(
      appBar: AppBar(title: Text('dash.boost'.tr())),
      body: async.when(
        loading: () => const ListSkeleton(),
        error: (e, _) => ErrorView(
          message: e.asApiException?.message,
          onRetry: () => ref.invalidate(boostOffersProvider(widget.propertyId)),
        ),
        data: (data) {
          final payment = _payment;
          if (payment != null) {
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                NoticeCard(icon: Icons.rocket_launch_outlined, text: 'dash.boostReserved'.tr()),
                const SizedBox(height: 12),
                PaymentInstructionsCard(
                  instructions: payment.obj('instructions'),
                  orderRef: payment.str('orderRef'),
                  amountMinor: payment.integer('amountMinor'),
                  currency: payment.str('currency', 'MZN'),
                ),
                const SizedBox(height: 12),
                PaymentProofForm(
                  paymentId: payment.str('paymentId'),
                  onSubmitted: () => Navigator.of(context).maybePop(),
                ),
              ],
            );
          }

          final offers = data.objList('offers');
          final running = data.objList('running');
          final busyKinds = running.map((r) => r.str('kind')).toSet();
          final total = offers
              .where((o) => _selected.contains(o.str('kind')))
              .fold<int>(0, (s, o) => s + o.integer('priceMinor'));
          final currency = offers.isEmpty ? 'MZN' : offers.first.str('currency', 'MZN');

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('dash.boostIntro'.tr(), style: const TextStyle(color: AppColors.onSurfaceVariant)),
              if (running.isNotEmpty) ...[
                SectionTitle('dash.boostRunning'.tr()),
                ...running.map((r) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(r.str('kind') == 'URGENT' ? 'dash.urgent'.tr() : 'dash.featured'.tr()),
                      subtitle: r.date('expiresAt') == null
                          ? null
                          : Text('dash.expires'.tr(args: [formatDate(r.date('expiresAt'))])),
                      trailing: StatusBadge(status: r.str('status')),
                    )),
              ],
              SectionTitle('dash.boostOptions'.tr()),
              if (offers.isEmpty) Text('dash.noBoosts'.tr()),
              ...offers.map((o) {
                final kind = o.str('kind');
                final taken = busyKinds.contains(kind);
                return Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  child: CheckboxListTile(
                    value: _selected.contains(kind),
                    onChanged: taken || _busy
                        ? null
                        : (v) => setState(() => v == true ? _selected.add(kind) : _selected.remove(kind)),
                    title: Text(pt ? o.str('namePt') : o.str('nameEn'),
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text([
                      if ((pt ? o.str('descriptionPt') : o.str('descriptionEn')).isNotEmpty)
                        pt ? o.str('descriptionPt') : o.str('descriptionEn'),
                      'dash.days'.tr(args: ['${o.integer('days')}']),
                      if (taken) 'dash.boostAlreadyOn'.tr(),
                    ].join('\n')),
                    secondary: Text(formatMinor(o.integer('priceMinor'), o.str('currency', 'MZN')),
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                  ),
                );
              }),
              if (!data.flag('destinationConfigured', true)) ...[
                const SizedBox(height: 8),
                NoticeCard(icon: Icons.info_outline, color: AppColors.error, text: 'dash.noDestination'.tr()),
              ],
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _selected.isEmpty || _busy ? null : _buy,
                child: _busy
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : Text(_selected.isEmpty ? 'dash.boost'.tr() : '${'dash.boost'.tr()} · ${formatMinor(total, currency)}'),
              ),
            ],
          );
        },
      ),
    );
  }
}
