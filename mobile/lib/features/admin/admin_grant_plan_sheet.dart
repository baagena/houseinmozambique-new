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
import '../../widgets/sheets.dart';

/// What a plan lets someone do, in plain words — how the iPhone app names an
/// access level, since it never shows plan names, prices or payment (App
/// Store guideline 3.1). Shown under the plan name elsewhere.
String accessSummary(Map<String, dynamic> plan) {
  final quota = plan.integer('listingQuota', 1);
  final featured = plan.integer('featuredQuota');
  if (plan.str('kind') == 'one_off') return 'dash.oneFeatured'.tr();
  final base = quota < 0 ? 'dash.unlimitedListings'.tr() : 'dash.upToListings'.tr(args: ['$quota']);
  return featured > 0 ? '$base · ${'dash.featuredCount'.tr(args: ['$featured'])}' : base;
}

/// The access someone has now, from plan-info's quota/used figures.
String currentAccess(Map<String, dynamic> info) {
  final quota = info.integer('quota', 1);
  final used = info.integer('used');
  final limit = quota < 0 ? '∞' : '$quota';
  return 'dash.listingsUsed'.tr(args: ['$used', limit]);
}

/// Staff give someone access by hand — e.g. a person who posted from an
/// iPhone and paid the team directly. No payment proof is asked: an admin
/// granting access has already decided. Web: AdminGrantPlan on the agent page.
///
/// Android/web call it "grant plan" and show plan names and prices; the
/// iPhone app calls it "give access" and describes what it unlocks.
class AdminGrantPlanSheet extends ConsumerStatefulWidget {
  final String agentId;
  final String agentName;
  const AdminGrantPlanSheet({super.key, required this.agentId, required this.agentName});

  @override
  ConsumerState<AdminGrantPlanSheet> createState() => _AdminGrantPlanSheetState();
}

class _AdminGrantPlanSheetState extends ConsumerState<AdminGrantPlanSheet> {
  String? _slug;
  int _months = 1;
  final _note = TextEditingController();
  bool _busy = false;
  String? _error;

  bool get _accessWording => !showsPaidPlans;

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  Future<void> _grant() async {
    if (_slug == null) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(adminRepositoryProvider).grantPlan(
            widget.agentId,
            planSlug: _slug!,
            months: _months,
            note: _note.text.trim(),
          );
      ref.invalidate(adminAgentPlanInfoProvider(widget.agentId));
      ref.invalidate(adminAgentsProvider);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_accessWording ? 'dash.accessGiven'.tr() : 'dash.planGranted'.tr())),
      );
      Navigator.pop(context);
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
    final async = ref.watch(adminAgentPlanInfoProvider(widget.agentId));
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.of(context).viewInsets.bottom + 24),
      child: async.when(
        loading: () => const SizedBox(height: 200, child: Center(child: CircularProgressIndicator())),
        error: (e, _) => SizedBox(
          height: 220,
          child: ErrorView(
            message: e.asApiException?.message,
            onRetry: () => ref.invalidate(adminAgentPlanInfoProvider(widget.agentId)),
          ),
        ),
        data: (info) {
          final plans = info.objList('plans');
          final isCorporate = info.flag('isCorporate');
          _slug ??= plans.isEmpty ? null : plans.first.str('slug');
          final chosen = plans.where((p) => p.str('slug') == _slug).firstOrNull;
          final monthly = chosen?.str('kind') == 'subscription';
          final title = _accessWording ? 'dash.giveAccess'.tr() : 'dash.grantPlan'.tr();

          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SheetTitle(title, subtitle: widget.agentName),
                if (_accessWording)
                  InfoRow('dash.currentAccess'.tr(), currentAccess(info))
                else ...[
                  InfoRow('dash.currentPlan'.tr(), info.strOrNull('currentPlan') ?? 'dash.noPlan'.tr()),
                  InfoRow('dash.usage'.tr(), currentAccess(info)),
                ],
                const SizedBox(height: 14),
                if (plans.isEmpty)
                  Text('dash.noGrantablePlans'.tr())
                else ...[
                  Text(_accessWording ? 'dash.chooseAccess'.tr() : 'dashboard.selectPlanTitle'.tr(),
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                  const SizedBox(height: 8),
                  for (final p in plans)
                    _OptionTile(
                      selected: p.str('slug') == _slug,
                      title: _accessWording ? accessSummary(p) : p.str('name'),
                      subtitle: _accessWording
                          ? null
                          : [accessSummary(p), if (p.str('price').isNotEmpty) p.str('price')].join(' · '),
                      onTap: _busy ? null : () => setState(() => _slug = p.str('slug')),
                    ),
                  if (monthly) ...[
                    const SizedBox(height: 12),
                    Text('dash.forHowLong'.tr(), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final m in const [1, 2, 3, 6, 12])
                          ChoiceChip(
                            label: Text(m == 1 ? 'dash.oneMonth'.tr() : 'dash.monthsCount'.tr(args: ['$m'])),
                            selected: _months == m,
                            onSelected: _busy ? null : (_) => setState(() => _months = m),
                          ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 14),
                  TextField(
                    controller: _note,
                    enabled: !_busy,
                    maxLength: 300,
                    decoration: InputDecoration(labelText: 'dash.noteOptional'.tr(), counterText: ''),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 6),
                    Text(_error!, style: const TextStyle(color: AppColors.error)),
                  ],
                  const SizedBox(height: 14),
                  SizedBox(
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _busy || _slug == null ? null : _grant,
                      child: _busy
                          ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                          : Text(isCorporate ? 'dash.activateAgency'.tr() : title),
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _OptionTile extends StatelessWidget {
  final bool selected;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;
  const _OptionTile({required this.selected, required this.title, this.subtitle, this.onTap});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Material(
          color: selected ? AppColors.primary.withValues(alpha: 0.05) : AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(14),
          child: InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: onTap,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: selected ? AppColors.primary : AppColors.surfaceContainerHigh,
                  width: selected ? 2 : 1,
                ),
              ),
              child: Row(
                children: [
                  Icon(selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                      color: selected ? AppColors.primary : AppColors.outline),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
                        if (subtitle != null)
                          Text(subtitle!, style: const TextStyle(fontSize: 12.5, color: AppColors.onSurfaceVariant)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
}

/// Opens the sheet; afterwards the person's access is re-read everywhere.
Future<void> openGrantPlan(BuildContext context, WidgetRef ref, String agentId, String agentName) async {
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => AdminGrantPlanSheet(agentId: agentId, agentName: agentName),
  );
  ref.invalidate(adminAgentPlanInfoProvider(agentId));
}

/// One line under a pending listing or an agent: how much this person can
/// post and how much they have used, with a button to give them more —
/// e.g. someone who posted from an iPhone and paid the team directly.
/// Android/web: plan name + "Grant plan". iPhone: access only + "Give access".
class AdminPlanStrip extends ConsumerWidget {
  final String agentId;
  final String agentName;
  const AdminPlanStrip({super.key, required this.agentId, required this.agentName});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(adminAgentPlanInfoProvider(agentId));
    final info = async.asData?.value;
    if (info != null && info.str('role') == 'ADMIN') return const SizedBox.shrink();

    final quota = info?.integer('quota', 1) ?? 1;
    final used = info?.integer('used') ?? 0;
    final full = info != null && !info.flag('canPublish', true);
    final accessWording = !showsPaidPlans;
    final heading = accessWording
        ? (quota < 0 ? 'dash.unlimitedListings'.tr() : 'dash.upToListings'.tr(args: ['$quota']))
        : (info?.strOrNull('currentPlan') ?? 'dash.noPlan'.tr());
    final color = full ? AppColors.error : const Color(0xFF166534);

    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.fromLTRB(12, 8, 8, 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.22)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(full ? Icons.error_outline : Icons.verified_outlined, size: 20, color: color),
              const SizedBox(width: 10),
              Expanded(
                child: info == null
                    ? Text(async.hasError ? '—' : 'common.loading'.tr(),
                        style: const TextStyle(fontSize: 12.5, color: AppColors.onSurfaceVariant))
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(heading,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
                          Text(
                            full
                                ? 'dash.planFullShort'.tr(args: ['$used', quota < 0 ? '∞' : '$quota'])
                                : 'dash.planUsageShort'.tr(args: ['$used', quota < 0 ? '∞' : '$quota']),
                            style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
                          ),
                        ],
                      ),
              ),
            ],
          ),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              style: TextButton.styleFrom(
                visualDensity: VisualDensity.compact,
                padding: const EdgeInsets.symmetric(horizontal: 8),
              ),
              icon: Icon(accessWording ? Icons.lock_open_outlined : Icons.add_card_outlined, size: 18),
              label: Text(accessWording ? 'dash.giveAccess'.tr() : 'dash.grantSubscription'.tr(),
                  maxLines: 1, overflow: TextOverflow.ellipsis),
              onPressed: () => openGrantPlan(context, ref, agentId, agentName),
            ),
          ),
        ],
      ),
    );
  }
}
