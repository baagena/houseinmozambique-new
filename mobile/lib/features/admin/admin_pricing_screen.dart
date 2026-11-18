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

/// Pricing plans — web: dashboard/admin/pricing.
/// Never reachable on iOS (see store_policy.dart); the router redirects.
class AdminPricingScreen extends ConsumerWidget {
  const AdminPricingScreen({super.key});

  Future<void> _edit(BuildContext context, WidgetRef ref, Map<String, dynamic>? plan) async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => _PlanFormScreen(plan: plan)),
    );
    if (saved == true) ref.invalidate(adminPricingProvider);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!showsPaidPlans) return const SizedBox.shrink();
    final async = ref.watch(adminPricingProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text('dash.pricingPlans'.tr()),
        actions: [IconButton(icon: const Icon(Icons.add), onPressed: () => _edit(context, ref, null))],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(adminPricingProvider.future),
        child: async.when(
          loading: () => const ListSkeleton(),
          error: (e, _) => ErrorView(message: e.asApiException?.message, onRetry: () => ref.invalidate(adminPricingProvider)),
          data: (plans) => ListView(
            padding: const EdgeInsets.all(16),
            children: plans.map((p) {
              final active = p.flag('isActive', true);
              return Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  title: Text(p.str('nameEn'), style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: active ? null : AppColors.outline,
                  )),
                  subtitle: Text(
                    '${p.str('slug')} · ${_kindLabel(p.str('kind'))}\n'
                    '${formatMinor(p.integer('priceMinor'), p.str('currency', 'MZN'))} · ${p.str('priceEn')} ${p.str('unitEn')}',
                    style: const TextStyle(fontSize: 12),
                  ),
                  isThreeLine: true,
                  onTap: () => _edit(context, ref, p),
                  trailing: PopupMenuButton<String>(
                    onSelected: (v) async {
                      final repo = ref.read(adminRepositoryProvider);
                      if (v == 'toggle') {
                        if (await runAction(context, () => repo.savePricingPlan({...p, 'isActive': !active}))) {
                          ref.invalidate(adminPricingProvider);
                        }
                      } else if (v == 'delete') {
                        final ok = await confirmDialog(context,
                            title: 'dash.deletePlan'.tr(), body: p.str('nameEn'), confirmLabel: 'common.delete'.tr(), destructive: true);
                        if (!ok || !context.mounted) return;
                        if (await runAction(context, () => repo.deletePricingPlan(p.str('id')))) {
                          ref.invalidate(adminPricingProvider);
                        }
                      }
                    },
                    itemBuilder: (_) => [
                      PopupMenuItem(value: 'toggle', child: Text(active ? 'dash.hidePlan'.tr() : 'dash.showPlan'.tr())),
                      PopupMenuItem(
                        value: 'delete',
                        child: Text('common.delete'.tr(), style: const TextStyle(color: AppColors.error)),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }
}

String _kindLabel(String kind) => switch (kind) {
      'one_off' => 'dash.kindOneOff'.tr(),
      'addon' => 'dash.kindAddon'.tr(),
      _ => 'dash.kindSubscription'.tr(),
    };

class _PlanFormScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic>? plan;
  const _PlanFormScreen({this.plan});

  @override
  ConsumerState<_PlanFormScreen> createState() => _PlanFormScreenState();
}

class _PlanFormScreenState extends ConsumerState<_PlanFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final Map<String, dynamic> _p = Map<String, dynamic>.from(widget.plan ?? const {});
  late final Map<String, TextEditingController> _c = {
    for (final k in const [
      'slug', 'nameEn', 'namePt', 'descriptionEn', 'descriptionPt', 'priceEn', 'pricePt',
      'unitEn', 'unitPt', 'badgeEn', 'badgePt', 'ctaEn', 'ctaPt',
    ])
      k: TextEditingController(text: _p.str(k)),
    'price': TextEditingController(
        text: widget.plan == null ? '' : (_p.integer('priceMinor') / 100).toStringAsFixed(_p.integer('priceMinor') % 100 == 0 ? 0 : 2)),
    'listingQuota': TextEditingController(text: '${_p.integer('listingQuota', 1)}'),
    'featuredQuota': TextEditingController(text: '${_p.integer('featuredQuota')}'),
    'durationDays': TextEditingController(text: _p.integerOrNull('durationDays')?.toString() ?? ''),
    'sortOrder': TextEditingController(text: '${_p.integer('sortOrder')}'),
  };
  late String _kind = _p.str('kind', 'subscription');
  late String _interval = _p.strOrNull('interval') ?? 'month';
  late String _ctaMode = _p.str('ctaMode', 'checkout');
  late bool _active = _p.flag('isActive', true);
  late bool _highlighted = _p.flag('highlighted');
  bool _busy = false;

  @override
  void dispose() {
    for (final c in _c.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final price = double.tryParse(_c['price']!.text.replaceAll(',', '.')) ?? 0;
    final body = <String, dynamic>{
      ..._p, // keeps the feature lists and anything this form doesn't edit
      for (final k in const [
        'slug', 'nameEn', 'namePt', 'descriptionEn', 'descriptionPt', 'priceEn', 'pricePt',
        'unitEn', 'unitPt', 'badgeEn', 'badgePt', 'ctaEn', 'ctaPt',
      ])
        k: _c[k]!.text.trim(),
      'kind': _kind,
      'interval': _kind == 'subscription' ? _interval : null,
      'priceMinor': (price * 100).round(),
      'listingQuota': int.tryParse(_c['listingQuota']!.text.trim()) ?? 1,
      'featuredQuota': int.tryParse(_c['featuredQuota']!.text.trim()) ?? 0,
      'durationDays': int.tryParse(_c['durationDays']!.text.trim()),
      'sortOrder': int.tryParse(_c['sortOrder']!.text.trim()) ?? 0,
      'ctaMode': _ctaMode,
      'isActive': _active,
      'highlighted': _highlighted,
    }..remove('priceMajor');
    setState(() => _busy = true);
    final ok = await runAction(context, () => ref.read(adminRepositoryProvider).savePricingPlan(body),
        success: 'admin.settingsUpdated'.tr());
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) Navigator.pop(context, true);
  }

  Widget _field(String key, String label, {bool required = false, TextInputType? type, int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextFormField(
        controller: _c[key],
        keyboardType: type,
        maxLines: maxLines,
        decoration: InputDecoration(labelText: label),
        validator: required ? (v) => (v == null || v.trim().isEmpty) ? 'common.required'.tr() : null : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const decimalType = TextInputType.numberWithOptions(decimal: true);
    return Scaffold(
      appBar: AppBar(title: Text(widget.plan == null ? 'dash.newPlan'.tr() : 'dash.editPlan'.tr())),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _field('slug', 'dash.planKey'.tr(), required: true),
            _field('nameEn', '${'admin.title'.tr()} (EN)', required: true),
            _field('namePt', '${'admin.title'.tr()} (PT)'),
            DropdownButtonFormField<String>(
              isExpanded: true,
              initialValue: _kind,
              decoration: InputDecoration(labelText: 'admin.type'.tr()),
              items: [
                for (final k in const ['subscription', 'one_off', 'addon'])
                  DropdownMenuItem(value: k, child: Text(_kindLabel(k))),
              ],
              onChanged: (v) => setState(() => _kind = v ?? 'subscription'),
            ),
            const SizedBox(height: 10),
            _field('price', 'dash.amountCharged'.tr(args: [_p.str('currency', 'MZN')]), type: decimalType),
            if (_kind == 'subscription')
              DropdownButtonFormField<String>(
              isExpanded: true,
                initialValue: _interval,
                decoration: InputDecoration(labelText: 'dash.billedEvery'.tr()),
                items: [
                  DropdownMenuItem(value: 'month', child: Text('dash.month'.tr())),
                  DropdownMenuItem(value: 'year', child: Text('dash.year'.tr())),
                ],
                onChanged: (v) => setState(() => _interval = v ?? 'month'),
              )
            else
              _field('durationDays', 'dash.durationDays'.tr(), type: TextInputType.number),
            const SizedBox(height: 10),
            _field('priceEn', '${'dash.priceLabel'.tr()} (EN)', required: true),
            _field('pricePt', '${'dash.priceLabel'.tr()} (PT)'),
            _field('unitEn', '${'dash.unitLabel'.tr()} (EN)'),
            _field('unitPt', '${'dash.unitLabel'.tr()} (PT)'),
            _field('descriptionEn', '${'admin.description'.tr()} (EN)', maxLines: 3),
            _field('descriptionPt', '${'admin.description'.tr()} (PT)', maxLines: 3),
            _field('listingQuota', 'dash.listingQuotaLabel'.tr(), type: TextInputType.number),
            _field('featuredQuota', 'dash.featuredQuotaLabel'.tr(), type: TextInputType.number),
            _field('badgeEn', 'Badge (EN)'),
            _field('badgePt', 'Badge (PT)'),
            _field('ctaEn', 'CTA (EN)'),
            _field('ctaPt', 'CTA (PT)'),
            _field('sortOrder', 'dash.sortOrder'.tr(), type: TextInputType.number),
            DropdownButtonFormField<String>(
              isExpanded: true,
              initialValue: _ctaMode,
              decoration: InputDecoration(labelText: 'dash.ctaMode'.tr()),
              items: [
                DropdownMenuItem(value: 'checkout', child: Text('dash.ctaCheckout'.tr())),
                DropdownMenuItem(value: 'contact', child: Text('dash.ctaContact'.tr())),
              ],
              onChanged: (v) => setState(() => _ctaMode = v ?? 'checkout'),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('admin.active'.tr()),
              value: _active,
              onChanged: (v) => setState(() => _active = v),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('dash.highlighted'.tr()),
              value: _highlighted,
              onChanged: (v) => setState(() => _highlighted = v),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _busy ? null : _save,
              child: _busy
                  ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text('common.save'.tr()),
            ),
          ],
        ),
      ),
    );
  }
}
