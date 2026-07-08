import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../repositories/home_repository.dart';
import '../../widgets/ad_banner.dart';
import '../../widgets/agent_card.dart';
import '../../widgets/error_view.dart';
import '../../widgets/property_card.dart';
import '../../widgets/favorites_fab.dart';
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
      floatingActionButton: const FavoritesFab(heroTag: 'home-favorites-fab'),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(homeDataProvider.future),
        child: homeAsync.when(
          loading: () => ListView(
            padding: const EdgeInsets.only(bottom: 100),
            children: const [
              SizedBox(height: 12),
              PropertyRowSkeletons(),
            ],
          ),
          error: (err, st) => ErrorView(
            message: err.asApiException?.message,
            onRetry: () => ref.invalidate(homeDataProvider),
          ),
          data: (home) => ListView(
            padding: const EdgeInsets.only(bottom: 100),
            children: _buildSections(context, home),
          ),
        ),
      ),
    );
  }

  // Mirrors the website's slot order: top_banner above the hero,
  // after_featured, sidebar_strip before the listing-type rows,
  // between_cities_1/2 interleaved with the city rows, before_footer last.
  // AdBanner renders nothing when its slot has no active ads.
  List<Widget> _buildSections(BuildContext context, HomeData home) {
    final cityEntries = home.cities.entries.where((e) => e.value.isNotEmpty).toList();

    return [
      AdBanner(ads: home.ads, position: 'top_banner'),
      const _HeroBanner(),
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
      AdBanner(ads: home.ads, position: 'after_featured'),
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
      AdBanner(ads: home.ads, position: 'sidebar_strip'),
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
      for (var c = 0; c < cityEntries.length; c++) ...[
        SectionHeader(title: 'home.exploreCity'.tr(args: [_capitalize(cityEntries[c].key)])),
        SizedBox(
          height: 266,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: cityEntries[c].value.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, i) => PropertyCard(
              property: cityEntries[c].value[i],
              heroTag: 'home-${cityEntries[c].key}-${cityEntries[c].value[i].id}',
            ),
          ),
        ),
        if (c == 0) AdBanner(ads: home.ads, position: 'between_cities_1'),
        if (c == 1) AdBanner(ads: home.ads, position: 'between_cities_2'),
      ],
      AdBanner(ads: home.ads, position: 'before_footer'),
      const SizedBox(height: 24),
    ];
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
