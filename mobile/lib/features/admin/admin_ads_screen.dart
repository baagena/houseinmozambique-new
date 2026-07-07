import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../repositories/admin_repository.dart';
import '../../widgets/error_view.dart';
import '../../widgets/shimmer_loaders.dart';
import 'admin_ad_form_screen.dart';

class AdminAdsScreen extends ConsumerWidget {
  const AdminAdsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final adsAsync = ref.watch(adminAdsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ads'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () async {
              final created = await Navigator.of(context).push<bool>(
                MaterialPageRoute(builder: (_) => const AdminAdFormScreen()),
              );
              if (created == true) ref.invalidate(adminAdsProvider);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(adminAdsProvider.future),
        child: adsAsync.when(
          loading: () => const ListSkeleton(),
          error: (err, st) => ErrorView(
            message: err.asApiException?.message,
            onRetry: () => ref.invalidate(adminAdsProvider),
          ),
          data: (ads) {
            if (ads.isEmpty) {
              return const EmptyView(icon: Icons.campaign_outlined, title: 'No ads configured');
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: ads.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final ad = ads[i];
                return Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    leading: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: Color(int.parse(ad.bgColor.replaceFirst('#', '0xFF'))),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.campaign, color: Colors.white, size: 20),
                    ),
                    title: Text(ad.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text('${ad.position} · ${ad.clickCount} clicks'),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(ad.isActive ? Icons.visibility : Icons.visibility_off, color: ad.isActive ? Colors.green : AppColors.outline, size: 18),
                        IconButton(
                          icon: const Icon(Icons.delete_outline),
                          onPressed: () async {
                            await ref.read(adminRepositoryProvider).deleteAd(ad.id);
                            ref.invalidate(adminAdsProvider);
                          },
                        ),
                      ],
                    ),
                    onTap: () async {
                      final changed = await Navigator.of(context).push<bool>(
                        MaterialPageRoute(builder: (_) => AdminAdFormScreen(ad: ad)),
                      );
                      if (changed == true) ref.invalidate(adminAdsProvider);
                    },
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
