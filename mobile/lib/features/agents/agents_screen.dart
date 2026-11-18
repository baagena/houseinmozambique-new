import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/agent_contact.dart';
import '../../models/agent.dart';
import '../../repositories/agent_repository.dart';
import '../../services/contact_tracker.dart';
import '../../widgets/error_view.dart';
import '../../widgets/shimmer_loaders.dart';
import 'agent_detail_screen.dart' show whatsappGreen;

final agentsListProvider = FutureProvider.autoDispose<List<Agent>>((ref) {
  return ref.watch(agentRepositoryProvider).getAll();
});

enum _Filter { all, agents, companies }

/// The directory: agents who post listings and corporate agencies that market
/// their services, searchable, each one a tap from WhatsApp.
class AgentsScreen extends ConsumerStatefulWidget {
  const AgentsScreen({super.key});

  @override
  ConsumerState<AgentsScreen> createState() => _AgentsScreenState();
}

class _AgentsScreenState extends ConsumerState<AgentsScreen> {
  final _search = TextEditingController();
  _Filter _filter = _Filter.all;

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  List<Agent> _matching(List<Agent> agents) {
    final q = _search.text.trim().toLowerCase();
    if (q.isEmpty) return agents;
    return agents
        .where((a) => [a.displayName, a.name, a.location, a.title, a.agencyBusinessType ?? '', ...a.agencyAreasServed, ...a.agencyServices]
            .any((field) => field.toLowerCase().contains(q)))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final agentsAsync = ref.watch(agentsListProvider);

    return Scaffold(
      appBar: AppBar(title: Text('agent.title'.tr())),
      body: agentsAsync.when(
        loading: () => const ListSkeleton(),
        error: (err, st) => ErrorView(
          message: err.asApiException?.message,
          onRetry: () => ref.invalidate(agentsListProvider),
        ),
        data: (agents) {
          final hasCompanies = agents.any((a) => a.isCorporate);
          final matching = _matching(agents);
          // Companies first, in their own section; then agents. A section with
          // nobody in it is left out rather than shown empty.
          final companies = matching.where((a) => a.isCorporate).toList();
          final people = matching.where((a) => !a.isCorporate).toList();
          final showCompanies = _filter != _Filter.agents && companies.isNotEmpty;
          final showPeople = _filter != _Filter.companies && people.isNotEmpty;
          return RefreshIndicator(
            onRefresh: () => ref.refresh(agentsListProvider.future),
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TextField(
                          controller: _search,
                          onChanged: (_) => setState(() {}),
                          textInputAction: TextInputAction.search,
                          decoration: InputDecoration(
                            hintText: 'agentProfile.searchHint'.tr(),
                            prefixIcon: const Icon(Icons.search),
                            suffixIcon: _search.text.isEmpty
                                ? null
                                : IconButton(
                                    tooltip: MaterialLocalizations.of(context).deleteButtonTooltip,
                                    icon: const Icon(Icons.close),
                                    onPressed: () => setState(_search.clear),
                                  ),
                          ),
                        ),
                        if (hasCompanies) ...[
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 8,
                            children: [
                              for (final (f, key, n) in [
                                (_Filter.all, 'agentProfile.filterAll', matching.length),
                                (_Filter.companies, 'agentProfile.filterCompanies', companies.length),
                                (_Filter.agents, 'agentProfile.filterAgents', people.length),
                              ])
                                ChoiceChip(
                                  label: Text('${key.tr()} · $n'),
                                  selected: _filter == f,
                                  onSelected: (_) => setState(() => _filter = f),
                                ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                if (!showCompanies && !showPeople)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Text('agentProfile.noResults'.tr(),
                            textAlign: TextAlign.center, style: const TextStyle(color: AppColors.onSurfaceVariant)),
                      ),
                    ),
                  )
                else ...[
                  if (showCompanies)
                    _Section(
                      icon: Icons.apartment,
                      title: 'agentProfile.sectionCompanies'.tr(),
                      hint: 'agentProfile.sectionCompaniesHint'.tr(),
                      count: companies.length,
                      accent: AppColors.secondary,
                      children: [for (final a in companies) _CompanyCard(agent: a)],
                    ),
                  if (showPeople)
                    _Section(
                      icon: Icons.groups_outlined,
                      title: 'agentProfile.sectionAgents'.tr(),
                      hint: 'agentProfile.sectionAgentsHint'.tr(),
                      count: people.length,
                      accent: AppColors.primary,
                      children: [for (final a in people) _AgentCard(agent: a)],
                    ),
                  const SliverToBoxAdapter(child: SizedBox(height: 24)),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

/// Straight to WhatsApp from the list — recorded like the profile button.
Future<void> _quickWhatsApp(BuildContext context, WidgetRef ref, Agent agent, String number) async {
  ref.read(contactTrackerProvider).profile(agent.id, 'whatsapp');
  try {
    await launchProfileWhatsApp(number, agent.displayName);
  } catch (_) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('common.somethingWentWrong'.tr())));
    }
  }
}

/// A titled group of the directory. Its heading stays pinned at the top
/// while the group is on screen, so a long list never loses its place.
class _Section extends StatelessWidget {
  final IconData icon;
  final String title;
  final String hint;
  final int count;
  final Color accent;
  final List<Widget> children;
  const _Section({
    required this.icon,
    required this.title,
    required this.hint,
    required this.count,
    required this.accent,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    final scale = MediaQuery.textScalerOf(context).scale(1);
    return SliverMainAxisGroup(slivers: [
      SliverPersistentHeader(
        pinned: true,
        delegate: _SectionHeader(icon: icon, title: title, hint: hint, count: count, accent: accent, height: 64 + 20 * (scale - 1).clamp(0, 1)),
      ),
      SliverPadding(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
        sliver: SliverList.separated(
          itemCount: children.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, i) => children[i],
        ),
      ),
    ]);
  }
}

class _SectionHeader extends SliverPersistentHeaderDelegate {
  final IconData icon;
  final String title;
  final String hint;
  final int count;
  final Color accent;
  final double height;
  _SectionHeader({
    required this.icon,
    required this.title,
    required this.hint,
    required this.count,
    required this.accent,
    required this.height,
  });

  @override
  double get minExtent => height;
  @override
  double get maxExtent => height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(color: accent.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, size: 20, color: accent),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 1),
                      decoration: BoxDecoration(color: accent.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                      child: Text('$count', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: accent)),
                    ),
                  ],
                ),
                Text(hint,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  bool shouldRebuild(_SectionHeader old) =>
      old.count != count || old.title != title || old.hint != hint || old.height != height;
}

/// A corporate agency: company logo, what it does, where — set apart from
/// agents with a warm tint, so companies read as companies at a glance.
class _CompanyCard extends ConsumerWidget {
  final Agent agent;
  const _CompanyCard({required this.agent});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final whatsapp = agent.contactWhatsapp;
    final services = agent.agencyServices;
    final areas = agent.agencyAreasServed.isNotEmpty ? agent.agencyAreasServed : [agent.location];
    final type = (agent.agencyBusinessType ?? '').trim();

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => context.push('/agent/${agent.id}'),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFFF8F1E4), Colors.white],
            ),
            border: Border.all(color: const Color(0x33845326)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0x22845326)),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: agent.avatar != null
                          ? CachedNetworkImage(imageUrl: agent.avatar!, fit: BoxFit.cover,
                              errorWidget: (_, __, ___) => _logoInitials())
                          : _logoInitials(),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(agent.displayName,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16, height: 1.2)),
                              ),
                              if (agent.isVerified)
                                const Padding(
                                  padding: EdgeInsets.only(left: 4),
                                  child: Icon(Icons.verified, size: 17, color: Color(0xFF1E88E5)),
                                ),
                            ],
                          ),
                          const SizedBox(height: 3),
                          Text(
                            type.isNotEmpty ? type : 'agentProfile.corporate'.tr(),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: AppColors.secondary, fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                if (services.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      for (final s in services.take(3)) _Tag(icon: Icons.check, text: s),
                      if (services.length > 3)
                        _Tag(icon: Icons.add, text: 'agentProfile.moreCount'.tr(args: ['${services.length - 3}'])),
                    ],
                  ),
                ],
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 16, color: AppColors.onSurfaceVariant),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        areas.length > 3 ? '${areas.take(3).join(', ')} +${areas.length - 3}' : areas.join(', '),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    if (whatsapp != null) ...[
                      Expanded(
                        child: SizedBox(
                          height: 40,
                          child: FilledButton.icon(
                            onPressed: () => _quickWhatsApp(context, ref, agent, whatsapp),
                            icon: const Icon(Icons.chat, size: 17),
                            label: Text('agentProfile.whatsapp'.tr(), maxLines: 1, overflow: TextOverflow.ellipsis),
                            style: FilledButton.styleFrom(
                              backgroundColor: whatsappGreen,
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              textStyle: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    Expanded(
                      child: SizedBox(
                        height: 40,
                        child: OutlinedButton(
                          onPressed: () => context.push('/agent/${agent.id}'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.secondary,
                            side: const BorderSide(color: Color(0x55845326)),
                            padding: const EdgeInsets.symmetric(horizontal: 10),
                            textStyle: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600),
                          ),
                          child: Text('agentProfile.viewProfile'.tr(), maxLines: 1, overflow: TextOverflow.ellipsis),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _logoInitials() => Container(
        color: const Color(0xFFF5EFE3),
        alignment: Alignment.center,
        child: Text(agent.initials, style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.secondary, fontSize: 18)),
      );
}

class _AgentCard extends ConsumerWidget {
  final Agent agent;
  const _AgentCard({required this.agent});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final whatsapp = agent.contactWhatsapp;
    final corporate = agent.isCorporate;
    final subtitle = corporate
        ? [if ((agent.agencyBusinessType ?? '').trim().isNotEmpty) agent.agencyBusinessType!.trim(), agent.location]
        : [if (agent.title.trim().isNotEmpty) agent.title.trim(), agent.location];
    final listings = agent.propertyCount == 1
        ? 'agentProfile.oneListing'.tr()
        : 'agentProfile.listingCount'.tr(args: ['${agent.propertyCount}']);

    return Material(
      color: AppColors.surfaceContainerLowest,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push('/agent/${agent.id}'),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.surfaceContainerHigh),
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(corporate ? 14 : 30),
                child: SizedBox(
                  width: 60,
                  height: 60,
                  child: agent.avatar != null
                      ? CachedNetworkImage(imageUrl: agent.avatar!, fit: BoxFit.cover,
                          errorWidget: (_, __, ___) => _initials())
                      : _initials(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(agent.displayName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15.5)),
                        ),
                        if (agent.isVerified)
                          const Padding(
                            padding: EdgeInsets.only(left: 4),
                            child: Icon(Icons.verified, size: 16, color: Color(0xFF1E88E5)),
                          ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(subtitle.where((s) => s.trim().isNotEmpty).join(' · '),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13)),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: [
                        if (corporate)
                          _Tag(icon: Icons.apartment, text: 'agentProfile.corporate'.tr())
                        // A zero count reads as "inactive": only real numbers are shown.
                        else if (agent.propertyCount > 0)
                          _Tag(icon: Icons.home_work_outlined, text: listings),
                        if (!corporate && (agent.yearsExperience ?? 0) > 0)
                          _Tag(icon: Icons.workspace_premium_outlined, text: 'agentProfile.yearsShort'.tr(args: ['${agent.yearsExperience}'])),
                        if (agent.isFeatured) _Tag(icon: Icons.star_rounded, text: 'agentProfile.featured'.tr(), color: AppColors.secondary),
                        if (agent.rating > 0) _Tag(icon: Icons.star_outline, text: agent.rating.toStringAsFixed(1)),
                      ],
                    ),
                  ],
                ),
              ),
              if (whatsapp != null) ...[
                const SizedBox(width: 8),
                // Straight to WhatsApp from the list — recorded like the profile button.
                Tooltip(
                  message: 'agentProfile.whatsapp'.tr(),
                  child: Material(
                    color: whatsappGreen,
                    shape: const CircleBorder(),
                    child: InkWell(
                      customBorder: const CircleBorder(),
                      onTap: () => _quickWhatsApp(context, ref, agent, whatsapp),
                      child: const SizedBox(width: 44, height: 44, child: Icon(Icons.chat, color: Colors.white, size: 21)),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _initials() => Container(
        color: const Color(0xFFF5EFE3),
        alignment: Alignment.center,
        child: Text(agent.initials, style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.secondary, fontSize: 18)),
      );
}

class _Tag extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color color;
  const _Tag({required this.icon, required this.text, this.color = AppColors.onSurfaceVariant});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(12)),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 13, color: color),
            const SizedBox(width: 4),
            Flexible(
              child: Text(text,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: color)),
            ),
          ],
        ),
      );
}
