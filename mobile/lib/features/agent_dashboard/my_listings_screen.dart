import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/labels.dart';
import '../../core/utils/store_policy.dart';
import '../../models/property.dart';
import '../../repositories/agent_dashboard_repository.dart';
import '../../widgets/dashboard_ui.dart';
import '../../widgets/error_view.dart';
import '../../widgets/shimmer_loaders.dart';
import '../../widgets/status_badge.dart';

enum _ListingAction { view, edit, boost, suspend, reactivate, sold, rented, unavailable, delete }

class MyListingsScreen extends ConsumerWidget {
  const MyListingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final propertiesAsync = ref.watch(myPropertiesProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('dashboard.myListings'.tr()),
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: () => context.push('/dashboard/listings/new')),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(myPropertiesProvider.future),
        child: propertiesAsync.when(
          loading: () => const ListSkeleton(),
          error: (err, st) => ErrorView(
            message: err.asApiException?.message,
            onRetry: () => ref.invalidate(myPropertiesProvider),
          ),
          data: (properties) {
            if (properties.isEmpty) {
              return ListView(children: [
                const SizedBox(height: 80),
                EmptyView(icon: Icons.home_work_outlined, title: 'dashboard.noListings'.tr()),
              ]);
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: properties.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) => _ListingCard(property: properties[index]),
            );
          },
        ),
      ),
    );
  }
}

class _ListingCard extends ConsumerWidget {
  final Property property;
  const _ListingCard({required this.property});

  List<_ListingAction> get _actions {
    final s = property.status.toUpperCase();
    return [
      if (s == 'PUBLISHED') _ListingAction.view,
      _ListingAction.edit,
      if (showsPaidPlans && s == 'PUBLISHED') _ListingAction.boost,
      if (s == 'PUBLISHED' || s == 'PENDING') _ListingAction.suspend,
      if (const ['SUSPENDED', 'SOLD', 'RENTED', 'UNAVAILABLE'].contains(s)) _ListingAction.reactivate,
      if (s == 'PUBLISHED') ...[
        if (property.listingType.toLowerCase().contains('rent') || property.priceUnit != 'sale')
          _ListingAction.rented
        else
          _ListingAction.sold,
        _ListingAction.unavailable,
      ],
      _ListingAction.delete,
    ];
  }

  String _label(_ListingAction a) => switch (a) {
        _ListingAction.view => 'dash.viewListing'.tr(),
        _ListingAction.edit => 'common.edit'.tr(),
        _ListingAction.boost => 'dash.boost'.tr(),
        _ListingAction.suspend => 'dash.pause'.tr(),
        _ListingAction.reactivate => 'dash.reactivate'.tr(),
        _ListingAction.sold => 'dash.markSold'.tr(),
        _ListingAction.rented => 'dash.markRented'.tr(),
        _ListingAction.unavailable => 'dash.markUnavailable'.tr(),
        _ListingAction.delete => 'common.delete'.tr(),
      };

  IconData _icon(_ListingAction a) => switch (a) {
        _ListingAction.view => Icons.open_in_new,
        _ListingAction.edit => Icons.edit_outlined,
        _ListingAction.boost => Icons.rocket_launch_outlined,
        _ListingAction.suspend => Icons.pause_circle_outline,
        _ListingAction.reactivate => Icons.play_circle_outline,
        _ListingAction.sold => Icons.sell_outlined,
        _ListingAction.rented => Icons.key_outlined,
        _ListingAction.unavailable => Icons.block,
        _ListingAction.delete => Icons.delete_outline,
      };

  Future<void> _handle(BuildContext context, WidgetRef ref, _ListingAction a) async {
    final repo = ref.read(agentDashboardRepositoryProvider);
    switch (a) {
      case _ListingAction.view:
        context.push('/property/${property.id}');
        return;
      case _ListingAction.edit:
        context.push('/dashboard/listings/${property.id}/edit');
        return;
      case _ListingAction.boost:
        context.push('/dashboard/listings/${property.id}/boost');
        return;
      case _ListingAction.delete:
        final ok = await confirmDialog(
          context,
          title: 'admin.deleteListingTitle'.tr(),
          body: 'admin.deleteListingBody'.tr(args: [property.title]),
          confirmLabel: 'common.delete'.tr(),
          destructive: true,
        );
        if (!ok || !context.mounted) return;
        if (await runAction(context, () => repo.deleteProperty(property.id))) {
          ref.invalidate(myPropertiesProvider);
        }
        return;
      default:
        final action = switch (a) {
          _ListingAction.suspend => 'suspend',
          _ListingAction.reactivate => 'reactivate',
          _ListingAction.sold => 'sold',
          _ListingAction.rented => 'rented',
          _ => 'unavailable',
        };
        if (await runAction(
          context,
          () => repo.setListingStatus(property.id, action),
          success: 'dash.listingUpdated'.tr(),
          // Apple: no upgrade or purchase wording on iOS (store_policy.dart).
          errorText: (e) => !showsPaidPlans && e?.statusCode == 403 ? 'dash.noFreeSlot'.tr() : null,
        )) {
          ref.invalidate(myPropertiesProvider);
          ref.invalidate(agentOverviewProvider);
        }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.fromLTRB(10, 8, 4, 8),
        leading: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: property.coverImage.isEmpty
              ? Container(width: 56, height: 56, color: AppColors.surfaceVariant)
              : CachedNetworkImage(imageUrl: property.coverImage, width: 56, height: 56, fit: BoxFit.cover),
        ),
        title: Text(property.localizedTitle(Localizations.localeOf(context).languageCode), maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Align(alignment: Alignment.centerLeft, child: StatusBadge(status: property.status)),
        ),
        onTap: () => context.push('/dashboard/listings/${property.id}/edit'),
        trailing: PopupMenuButton<_ListingAction>(
          tooltip: statusLabel(property.status),
          onSelected: (a) => _handle(context, ref, a),
          itemBuilder: (_) => _actions
              .map((a) => PopupMenuItem(
                    value: a,
                    child: Row(children: [
                      Icon(_icon(a), size: 20, color: a == _ListingAction.delete ? AppColors.error : null),
                      const SizedBox(width: 12),
                      Flexible(
                        child: Text(_label(a),
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(color: a == _ListingAction.delete ? AppColors.error : null)),
                      ),
                    ]),
                  ))
              .toList(),
        ),
      ),
    );
  }
}
