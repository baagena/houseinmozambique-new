import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/json.dart';
import '../../widgets/sheets.dart';

/// Where someone stands before posting a listing, decided from who they are
/// and what their plan covers (GET /api/dashboard/entitlement — the same
/// answer the website's wizard uses). Nobody is shown a price list they do
/// not need:
///
///  - admins post without plans or payment;
///  - someone whose plan has room goes straight to the form, with a line
///    saying which plan covers it;
///  - only someone whose plan is full is stopped, and offered the ways on.
enum PlanAccess { admin, covered, full }

class PlanStatus {
  final PlanAccess access;
  final String? planName;
  final int quota; // -1 = unlimited
  final int used;
  final int credits;
  final bool inGrace;
  /// A bigger plan exists (the server lists only plans above this one).
  final bool canUpgrade;

  const PlanStatus({
    required this.access,
    this.planName,
    this.quota = 1,
    this.used = 0,
    this.credits = 0,
    this.inGrace = false,
    this.canUpgrade = false,
  });

  /// [role] is the signed-in account's role; [data] the entitlement response.
  factory PlanStatus.from(String role, Map<String, dynamic> data) {
    if (role == 'ADMIN') return const PlanStatus(access: PlanAccess.admin);
    final s = data.obj('state');
    final canPublish = s.flag('canPublish', true);
    return PlanStatus(
      access: canPublish ? PlanAccess.covered : PlanAccess.full,
      planName: s.strOrNull('planName'),
      quota: s.integer('quota', 1),
      used: s.integer('used'),
      credits: s.integer('credits'),
      inGrace: s.flag('inGrace'),
      canUpgrade: data.objList('upgrades').isNotEmpty,
    );
  }

  String get usage => quota < 0 ? 'planGate.usageUnlimited'.tr(args: ['$used']) : 'planGate.usage'.tr(args: ['$used', '$quota']);
}

/// The line at the top of the listing form: which plan covers this listing.
class PlanBanner extends StatelessWidget {
  final PlanStatus status;
  final bool showUpgrade;
  const PlanBanner({super.key, required this.status, required this.showUpgrade});

  @override
  Widget build(BuildContext context) {
    final admin = status.access == PlanAccess.admin;
    final color = admin ? AppColors.primary : const Color(0xFF166534);
    final title = admin
        ? 'planGate.adminTitle'.tr()
        : 'planGate.coveredTitle'.tr(args: [status.planName ?? 'planGate.yourPlan'.tr()]);
    final body = admin ? 'planGate.adminBody'.tr() : status.usage;
    final upsell = showUpgrade && !admin && status.canUpgrade;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(admin ? Icons.admin_panel_settings_outlined : Icons.verified_outlined, color: color, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontWeight: FontWeight.w700, color: color, fontSize: 13.5)),
                const SizedBox(height: 1),
                Text(body, style: const TextStyle(fontSize: 12.5, color: AppColors.onSurfaceVariant)),
                if (upsell)
                  InkWell(
                    onTap: () => context.push('/dashboard/billing'),
                    child: Padding(
                      padding: const EdgeInsets.only(top: 4, bottom: 2),
                      child: Text(
                        '${'planGate.seePlans'.tr()} →',
                        style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: AppColors.secondary),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Shown instead of the form while the plan is being checked, or when it is
/// full.
class PlanGateView extends StatelessWidget {
  final ScrollController scrollController;
  final PlanStatus? status; // null while loading
  final VoidCallback onClose;
  final bool showPaidOptions;

  const PlanGateView({
    super.key,
    required this.scrollController,
    required this.status,
    required this.onClose,
    required this.showPaidOptions,
  });

  @override
  Widget build(BuildContext context) {
    final s = status;
    if (s == null) {
      return ListView(
        controller: scrollController,
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          SheetTitle('dashboard.addListing'.tr(), onClose: onClose),
          const SizedBox(height: 80),
          const Center(child: CircularProgressIndicator()),
          const SizedBox(height: 16),
          Center(
            child: Text('planGate.checking'.tr(), style: const TextStyle(color: AppColors.onSurfaceVariant)),
          ),
        ],
      );
    }

    // Full.
    return ListView(
      controller: scrollController,
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      children: [
        SheetTitle('dashboard.addListing'.tr(), onClose: onClose),
        const SizedBox(height: 8),
        Center(
          child: Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(color: AppColors.secondaryContainer.withValues(alpha: 0.5), shape: BoxShape.circle),
            child: const Icon(Icons.home_work_outlined, size: 34, color: AppColors.secondary),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'planGate.fullTitle'.tr(),
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 19, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        Text(
          s.inGrace
              ? 'planGate.graceBody'.tr()
              : 'planGate.fullBody'.tr(args: [s.planName ?? 'planGate.yourPlan'.tr(), s.usage]),
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppColors.onSurfaceVariant, height: 1.35),
        ),
        const SizedBox(height: 18),
        _UsageBar(used: s.used, quota: s.quota),
        const SizedBox(height: 24),
        if (showPaidOptions) ...[
          ElevatedButton.icon(
            icon: const Icon(Icons.trending_up, size: 18),
            label: Text(s.inGrace ? 'planGate.renew'.tr() : 'planGate.upgrade'.tr()),
            onPressed: () => context.push('/dashboard/billing'),
          ),
          const SizedBox(height: 10),
        ],
        OutlinedButton.icon(
          icon: const Icon(Icons.pause_circle_outline, size: 18),
          label: Text('planGate.freeSlot'.tr()),
          onPressed: () => context.push('/dashboard/listings'),
        ),
        const SizedBox(height: 12),
        Text(
          'planGate.freeSlotHint'.tr(),
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 12, color: AppColors.outline),
        ),
      ],
    );
  }
}

class _UsageBar extends StatelessWidget {
  final int used;
  final int quota;
  const _UsageBar({required this.used, required this.quota});

  @override
  Widget build(BuildContext context) {
    if (quota <= 0) return const SizedBox.shrink();
    return Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: (used / quota).clamp(0, 1).toDouble(),
            minHeight: 10,
            backgroundColor: AppColors.surfaceContainer,
            color: AppColors.secondary,
          ),
        ),
        const SizedBox(height: 6),
        Text('planGate.usage'.tr(args: ['$used', '$quota']), style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)),
      ],
    );
  }
}
