import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../repositories/admin_repository.dart';
import '../../widgets/error_view.dart';
import '../../widgets/shimmer_loaders.dart';

class AdminApprovalsScreen extends ConsumerWidget {
  const AdminApprovalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingAsync = ref.watch(adminPendingPropertiesProvider);

    Future<void> act(String id, String status) async {
      try {
        await ref.read(adminRepositoryProvider).setPropertyStatus(id, status);
        ref.invalidate(adminPendingPropertiesProvider);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(status == 'PUBLISHED' ? 'Listing approved' : 'Listing rejected')),
          );
        }
      } catch (e) {
        if (context.mounted) {
          final message = e.asApiException?.message ?? 'Something went wrong';
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
        }
      }
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Approvals')),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(adminPendingPropertiesProvider.future),
        child: pendingAsync.when(
          loading: () => const ListSkeleton(),
          error: (err, st) => ErrorView(
            message: err.asApiException?.message,
            onRetry: () => ref.invalidate(adminPendingPropertiesProvider),
          ),
          data: (properties) {
            if (properties.isEmpty) {
              return const EmptyView(
                icon: Icons.fact_check_outlined,
                title: 'All caught up',
                body: 'No listings are waiting for review.',
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: properties.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, i) {
                final p = properties[i];
                return Card(
                  clipBehavior: Clip.antiAlias,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (p.coverImage.isNotEmpty)
                        AspectRatio(
                          aspectRatio: 16 / 9,
                          child: CachedNetworkImage(imageUrl: p.coverImage, fit: BoxFit.cover),
                        ),
                      Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(p.title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                            const SizedBox(height: 2),
                            Text(p.location, style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                            const SizedBox(height: 2),
                            Text(
                              'Listed by ${p.host?.name ?? 'Unknown agent'}',
                              style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton.icon(
                                    style: OutlinedButton.styleFrom(foregroundColor: AppColors.error),
                                    icon: const Icon(Icons.close, size: 18),
                                    label: const Text('Reject'),
                                    onPressed: () => act(p.id, 'REJECTED'),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: ElevatedButton.icon(
                                    icon: const Icon(Icons.check, size: 18),
                                    label: const Text('Approve'),
                                    onPressed: () => act(p.id, 'PUBLISHED'),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
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
