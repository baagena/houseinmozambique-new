import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../repositories/agent_dashboard_repository.dart';
import '../../widgets/error_view.dart';
import '../../widgets/shimmer_loaders.dart';

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
              return EmptyView(icon: Icons.home_work_outlined, title: 'dashboard.noListings'.tr());
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: properties.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final property = properties[index];
                return Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(10),
                    leading: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: property.coverImage.isEmpty
                          ? Container(width: 56, height: 56, color: AppColors.surfaceVariant)
                          : CachedNetworkImage(imageUrl: property.coverImage, width: 56, height: 56, fit: BoxFit.cover),
                    ),
                    title: Text(property.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                    subtitle: Text(property.status),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(icon: const Icon(Icons.edit_outlined), onPressed: () => context.push('/dashboard/listings/${property.id}/edit')),
                        IconButton(
                          icon: const Icon(Icons.delete_outline),
                          onPressed: () async {
                            final confirmed = await showDialog<bool>(
                              context: context,
                              builder: (context) => AlertDialog(
                                title: Text(property.title),
                                content: Text('${'common.delete'.tr()}?'),
                                actions: [
                                  TextButton(onPressed: () => Navigator.pop(context, false), child: Text('common.cancel'.tr())),
                                  TextButton(onPressed: () => Navigator.pop(context, true), child: Text('common.delete'.tr())),
                                ],
                              ),
                            );
                            if (confirmed == true) {
                              await ref.read(agentDashboardRepositoryProvider).deleteProperty(property.id);
                              ref.invalidate(myPropertiesProvider);
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
