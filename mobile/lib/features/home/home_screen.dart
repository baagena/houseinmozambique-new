import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../models/ad.dart';
import '../../repositories/home_repository.dart';
import '../../widgets/agent_card.dart';
import '../../widgets/error_view.dart';
import '../../widgets/property_card.dart';
import '../../widgets/section_header.dart';
import '../../widgets/shimmer_loaders.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final homeAsync = ref.watch(homeDataProvider);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Image.asset('assets/images/logo.png', width: 28, height: 28, errorBuilder: (_, __, ___) => const Icon(Icons.home_work)),
            const SizedBox(width: 8),
            const Text('House in Mozambique', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.article_outlined), onPressed: () => context.push('/blog')),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(homeDataProvider.future),
        child: homeAsync.when(
          loading: () => ListView(
            children: const [
              SizedBox(height: 12),
              PropertyRowSkeletons(),
            ],
          ),
          error: (err, st) => ErrorView(
            message: err is ApiException ? err.message : null,
            onRetry: () => ref.invalidate(homeDataProvider),
          ),
          data: (home) => ListView(
            children: [
              const SizedBox(height: 200, child: _HeroBanner()),
              if (home.ads.any((a) => a.position == 'top_banner'))
                _AdBanner(ad: home.ads.firstWhere((a) => a.position == 'top_banner')),
              if (home.featured.isNotEmpty) ...[
                SectionHeader(title: 'home.featured'.tr(), onSeeAll: () => context.go('/explore')),
                SizedBox(
                  height: 266,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: home.featured.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 12),
                    itemBuilder: (context, i) => PropertyCard(
                      property: home.featured[i],
                      heroTag: 'home-featured-${home.featured[i].id}',
                    ),
                  ),
                ),
              ],
              if (home.featuredAgents.isNotEmpty) ...[
                SectionHeader(title: 'home.featuredAgents'.tr(), onSeeAll: () => context.go('/agents')),
                SizedBox(
                  height: 148,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: home.featuredAgents.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 16),
                    itemBuilder: (context, i) => AgentCard(agent: home.featuredAgents[i]),
                  ),
                ),
              ],
              for (final entry in home.listingTypes.entries)
                if (entry.value.isNotEmpty) ...[
                  SectionHeader(title: _listingTypeLabel(entry.key), onSeeAll: () => context.go('/explore')),
                  SizedBox(
                    height: 266,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: entry.value.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 12),
                      itemBuilder: (context, i) => PropertyCard(
                        property: entry.value[i],
                        heroTag: 'home-${entry.key}-${entry.value[i].id}',
                      ),
                    ),
                  ),
                ],
              for (final entry in home.cities.entries)
                if (entry.value.isNotEmpty) ...[
                  SectionHeader(title: 'home.exploreCity'.tr(args: [_capitalize(entry.key)])),
                  SizedBox(
                    height: 266,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: entry.value.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 12),
                      itemBuilder: (context, i) => PropertyCard(
                        property: entry.value[i],
                        heroTag: 'home-${entry.key}-${entry.value[i].id}',
                      ),
                    ),
                  ),
                ],
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  String _listingTypeLabel(String key) {
    switch (key) {
      case 'rent':
        return 'home.forRent'.tr();
      case 'buy':
        return 'home.forSale'.tr();
      default:
        return 'home.shortStay'.tr();
    }
  }

  String _capitalize(String s) => s.isEmpty ? s : '${s[0].toUpperCase()}${s.substring(1)}';
}

class _HeroBanner extends StatelessWidget {
  const _HeroBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [AppColors.primary, AppColors.primaryContainer], begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('home.heroTitle'.tr(), style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text('home.heroSubtitle'.tr(), style: const TextStyle(color: Colors.white70, fontSize: 14)),
          const SizedBox(height: 16),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: AppColors.primary),
            onPressed: () => context.go('/explore'),
            child: Text('common.search'.tr()),
          ),
        ],
      ),
    );
  }
}

class _AdBanner extends StatelessWidget {
  final Ad ad;
  const _AdBanner({required this.ad});

  Color _hex(String value) => Color(int.parse(value.replaceFirst('#', '0xFF')));

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: _hex(ad.bgColor), borderRadius: BorderRadius.circular(16)),
      child: Row(
        children: [
          if (ad.imageUrl != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: CachedNetworkImage(imageUrl: ad.imageUrl!, width: 44, height: 44, fit: BoxFit.cover),
            ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(ad.title, style: TextStyle(color: _hex(ad.textColor), fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
