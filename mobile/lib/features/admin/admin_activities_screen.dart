import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../repositories/admin_repository.dart';
import '../../widgets/error_view.dart';
import '../../widgets/shimmer_loaders.dart';

class AdminActivitiesScreen extends ConsumerWidget {
  const AdminActivitiesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activitiesAsync = ref.watch(adminActivitiesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Activity')),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(adminActivitiesProvider.future),
        child: activitiesAsync.when(
          loading: () => const ListSkeleton(),
          error: (err, st) => ErrorView(
            message: err.asApiException?.message,
            onRetry: () => ref.invalidate(adminActivitiesProvider),
          ),
          data: (activities) {
            if (activities.isEmpty) {
              return const EmptyView(icon: Icons.notifications_none, title: 'No activity yet');
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: activities.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final a = activities[i];
                return Card(
                  color: a.isRead ? null : AppColors.primaryContainer.withValues(alpha: 0.08),
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(14),
                    title: Text(a.subject, style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text('${a.name} · ${a.email}\n${a.message}', maxLines: 3, overflow: TextOverflow.ellipsis),
                    ),
                    isThreeLine: true,
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
