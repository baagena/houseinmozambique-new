import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/agent_contact.dart';
import '../../models/agent.dart';
import '../../models/property.dart';
import '../../repositories/agent_repository.dart';
import '../../services/contact_tracker.dart';
import '../../widgets/error_view.dart';
import '../../widgets/property_card.dart';

final agentDetailProvider =
    FutureProvider.autoDispose.family<(Agent, List<Property>), String>((ref, id) {
  return ref.watch(agentRepositoryProvider).getById(id);
});

/// WhatsApp's own green, a shade darker so white text stays readable.
const whatsappGreen = Color(0xFF1DA851);

/// Social networks in display order, with their logo asset and label.
const socialNetworks = <(String, String)>[
  ('facebook', 'Facebook'),
  ('instagram', 'Instagram'),
  ('linkedin', 'LinkedIn'),
  ('tiktok', 'TikTok'),
  ('youtube', 'YouTube'),
  ('x', 'X'),
];

/// An agent's public profile: who they are, how to reach them, and (for
/// agents who post) their listings. Corporate agencies — companies that market
/// their services rather than post listings — get a company layout. Every
/// contact press is recorded so the agent can see how people reached them.
class AgentDetailScreen extends ConsumerWidget {
  final String agentId;
  const AgentDetailScreen({super.key, required this.agentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(agentDetailProvider(agentId));

    return detailAsync.when(
      loading: () => Scaffold(appBar: AppBar(), body: const Center(child: CircularProgressIndicator())),
      error: (err, st) => Scaffold(
        appBar: AppBar(),
        body: ErrorView(
          message: err.asApiException?.message,
          onRetry: () => ref.invalidate(agentDetailProvider(agentId)),
        ),
      ),
      data: (result) => _AgentProfile(agent: result.$1, properties: result.$2),
    );
  }
}

class _AgentProfile extends ConsumerWidget {
  final Agent agent;
  final List<Property> properties;
  const _AgentProfile({required this.agent, required this.properties});

  /// Records the press, then opens the channel; a failure to open says so.
  Future<void> _contact(BuildContext context, WidgetRef ref, String channel, Future<void> Function() open) async {
    ref.read(contactTrackerProvider).profile(agent.id, channel);
    try {
      await open();
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('common.somethingWentWrong'.tr())));
      }
    }
  }

  void _message(BuildContext context, WidgetRef ref) {
    ref.read(contactTrackerProvider).profile(agent.id, 'form');
    context.push('/contact', extra: {'agentId': agent.id});
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final phone = agent.contactPhone;
    final whatsapp = agent.contactWhatsapp;
    final email = agent.contactEmail;
    final website = agent.website;
    final socials = [
      for (final (key, label) in socialNetworks)
        if (agent.socialLinks[key] != null) (key, label, agent.socialLinks[key]!),
    ];
    final about = agent.about;
    final expertise = agent.expertise;
    final areas = agent.agencyAreasServed;

    final secondary = <_Channel>[
      if (phone != null)
        _Channel(Icons.call_outlined, 'agentProfile.call'.tr(), () => _contact(context, ref, 'call', () => launchProfileCall(phone))),
      if (email != null)
        _Channel(Icons.mail_outline, 'agentProfile.email'.tr(), () => _contact(context, ref, 'email', () => launchProfileEmail(email))),
      if (website != null)
        _Channel(Icons.language, 'agentProfile.website'.tr(), () => _contact(context, ref, 'website', () => launchExternalLink(website))),
      _Channel(Icons.chat_bubble_outline, 'agentProfile.message'.tr(), () => _message(context, ref)),
    ];

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        slivers: [
          _Banner(title: agent.displayName),
          SliverToBoxAdapter(child: _Header(agent: agent)),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
            sliver: SliverList.list(children: [
              _Stats(agent: agent),
              const SizedBox(height: 16),

              // ── Get in touch ──
              _Section(
                title: 'agentProfile.getInTouch'.tr(),
                subtitle: whatsapp != null ? 'agentProfile.getInTouchHint'.tr() : null,
                children: [
                  _ChannelRow(channels: secondary),
                  if (socials.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Text('agentProfile.follow'.tr(),
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.onSurfaceVariant, letterSpacing: 0.4)),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        for (final (key, label, url) in socials)
                          _SocialButton(
                            network: key,
                            label: label,
                            onTap: () => _contact(context, ref, key, () => launchExternalLink(url)),
                          ),
                      ],
                    ),
                  ],
                ],
              ),

              if (about != null)
                _Section(
                  title: agent.isCorporate ? 'agentProfile.aboutCompany'.tr() : 'agentProfile.about'.tr(),
                  children: [Text(about, style: const TextStyle(fontSize: 14.5, height: 1.55, color: AppColors.onSurface))],
                ),

              if (expertise.isNotEmpty || areas.isNotEmpty || agent.officeAddress != null)
                _Section(
                  title: agent.isCorporate ? 'agentProfile.services'.tr() : 'agent.specializations'.tr(),
                  children: [
                    if (expertise.isNotEmpty) _Chips(items: expertise),
                    if (areas.isNotEmpty) ...[
                      if (expertise.isNotEmpty) const SizedBox(height: 16),
                      _Label('agentProfile.areas'.tr()),
                      const SizedBox(height: 8),
                      _Chips(items: areas, icon: Icons.location_on_outlined),
                    ],
                    if (agent.officeAddress != null) ...[
                      const SizedBox(height: 16),
                      _Label('agentProfile.office'.tr()),
                      const SizedBox(height: 6),
                      InkWell(
                        borderRadius: BorderRadius.circular(8),
                        onTap: () => launchExternalLink(
                          'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(agent.officeAddress!)}',
                        ),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.map_outlined, size: 18, color: AppColors.secondary),
                              const SizedBox(width: 8),
                              Expanded(child: Text(agent.officeAddress!, style: const TextStyle(color: AppColors.secondary, height: 1.35))),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ],
                ),

              if (agent.isCorporate && agent.name.trim().isNotEmpty && agent.name != agent.displayName)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text('agentProfile.representedBy'.tr(args: [agent.name]),
                      style: const TextStyle(color: AppColors.onSurfaceVariant)),
                ),

              if (agent.isVerified)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF5EFE3),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.verified_user_outlined, size: 20, color: AppColors.secondary),
                      const SizedBox(width: 10),
                      Expanded(child: Text('agentProfile.verifiedNote'.tr(), style: const TextStyle(fontSize: 12.5, height: 1.4))),
                    ],
                  ),
                ),

              // ── Listings: agents who post. Companies show them only if any. ──
              if (properties.isNotEmpty || !agent.isCorporate) ...[
                const SizedBox(height: 4),
                Text('agent.listings'.tr(), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                if (properties.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(14)),
                    child: Text('agentProfile.noListings'.tr(), style: const TextStyle(color: AppColors.onSurfaceVariant, height: 1.4)),
                  )
                else
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    padding: EdgeInsets.zero,
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 16,
                      childAspectRatio: 0.8,
                    ),
                    itemCount: properties.length,
                    itemBuilder: (context, i) =>
                        PropertyCard(property: properties[i], width: double.infinity, swipeableImages: true),
                  ),
              ],
            ]),
          ),
        ],
      ),
      // WhatsApp and Call stay one tap away while scrolling.
      bottomNavigationBar: _ContactBar(
        onWhatsApp: whatsapp == null
            ? null
            : () => _contact(context, ref, 'whatsapp', () => launchProfileWhatsApp(whatsapp, agent.displayName)),
        onCall: phone == null ? null : () => _contact(context, ref, 'call', () => launchProfileCall(phone)),
        onMessage: () => _message(context, ref),
      ),
    );
  }
}

// ── Header ────────────────────────────────────────────────────────────────

class _Banner extends StatelessWidget {
  final String title;
  const _Banner({required this.title});

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;
    return SliverAppBar(
      pinned: true,
      expandedHeight: 96,
      backgroundColor: AppColors.primary,
      foregroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      flexibleSpace: LayoutBuilder(builder: (context, constraints) {
        // The name joins the bar once the header has scrolled under it.
        final collapsed = constraints.maxHeight <= kToolbarHeight + top + 4;
        return FlexibleSpaceBar(
          titlePadding: const EdgeInsetsDirectional.only(start: 56, end: 16, bottom: 16),
          title: AnimatedOpacity(
            opacity: collapsed ? 1 : 0,
            duration: const Duration(milliseconds: 160),
            child: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w600)),
          ),
          background: const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppColors.primary, AppColors.primaryContainer],
              ),
            ),
          ),
        );
      }),
    );
  }
}

class _Header extends StatelessWidget {
  final Agent agent;
  const _Header({required this.agent});

  @override
  Widget build(BuildContext context) {
    final corporate = agent.isCorporate;
    final radius = corporate ? 22.0 : 60.0;
    final subtitle = corporate
        ? [if ((agent.agencyBusinessType ?? '').trim().isNotEmpty) agent.agencyBusinessType!.trim(), agent.location]
        : [if (agent.title.trim().isNotEmpty) agent.title.trim(), agent.location];

    return Stack(
      clipBehavior: Clip.none,
      alignment: Alignment.topCenter,
      children: [
        // The banner continues behind the top half of the photo.
        Container(height: 52, color: AppColors.primaryContainer),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
          child: Column(
            children: [
              Container(
                width: 104,
                height: 104,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(radius),
                  boxShadow: const [BoxShadow(color: Color(0x22000000), blurRadius: 12, offset: Offset(0, 4))],
                ),
                padding: const EdgeInsets.all(4),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(radius - 4),
                  child: agent.avatar != null
                      ? CachedNetworkImage(imageUrl: agent.avatar!, fit: BoxFit.cover,
                          errorWidget: (_, __, ___) => _Initials(agent: agent))
                      : _Initials(agent: agent),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Flexible(
                    child: Text(
                      agent.displayName,
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.onSurface, height: 1.2),
                    ),
                  ),
                  if (agent.isVerified) ...[
                    const SizedBox(width: 6),
                    Tooltip(
                      message: 'agent.verified'.tr(),
                      child: const Icon(Icons.verified, size: 20, color: Color(0xFF1E88E5)),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 6),
              Text(
                subtitle.where((s) => s.trim().isNotEmpty).join(' · '),
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 14),
              ),
              const SizedBox(height: 10),
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 8,
                runSpacing: 6,
                children: [
                  _Badge(
                    icon: corporate ? Icons.apartment : Icons.person_outline,
                    label: corporate ? 'agentProfile.corporate'.tr() : 'agentProfile.professional'.tr(),
                  ),
                  if (agent.isFeatured)
                    _Badge(icon: Icons.star_rounded, label: 'agentProfile.featured'.tr(), color: AppColors.secondary),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Initials extends StatelessWidget {
  final Agent agent;
  const _Initials({required this.agent});

  @override
  Widget build(BuildContext context) => Container(
        color: const Color(0xFFF5EFE3),
        alignment: Alignment.center,
        child: Text(
          agent.initials.isNotEmpty ? agent.initials : agent.displayName.characters.first.toUpperCase(),
          style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w700, color: AppColors.secondary),
        ),
      );
}

class _Badge extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _Badge({required this.icon, required this.label, this.color = AppColors.primary});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 15, color: color),
            const SizedBox(width: 5),
            Flexible(child: Text(label, style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: color))),
          ],
        ),
      );
}

class _Stats extends StatelessWidget {
  final Agent agent;
  const _Stats({required this.agent});

  @override
  Widget build(BuildContext context) {
    final tiles = <(String, String)>[
      if (!agent.isCorporate || agent.propertyCount > 0) ('${agent.propertyCount}', 'agentProfile.statListings'.tr()),
      if (agent.yearsExperience != null && agent.yearsExperience! > 0) ('${agent.yearsExperience}+', 'agentProfile.statYears'.tr()),
      if (agent.rating > 0) ('★ ${agent.rating.toStringAsFixed(1)}', 'agentProfile.statRating'.tr()),
    ];
    if (tiles.isEmpty) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.surfaceContainerHigh),
      ),
      child: IntrinsicHeight(
        child: Row(
          children: [
            for (var i = 0; i < tiles.length; i++) ...[
              if (i > 0) const VerticalDivider(width: 1, color: AppColors.surfaceContainerHigh),
              Expanded(
                child: Column(
                  children: [
                    Text(tiles[i].$1, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.primary)),
                    const SizedBox(height: 2),
                    Text(tiles[i].$2,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Sections ──────────────────────────────────────────────────────────────

class _Section extends StatelessWidget {
  final String title;
  final String? subtitle;
  final List<Widget> children;
  const _Section({required this.title, this.subtitle, required this.children});

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.surfaceContainerHigh),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            if (subtitle != null) ...[
              const SizedBox(height: 4),
              Text(subtitle!, style: const TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant)),
            ],
            const SizedBox(height: 14),
            ...children,
          ],
        ),
      );
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);

  @override
  Widget build(BuildContext context) => Text(text,
      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.onSurfaceVariant, letterSpacing: 0.4));
}

class _Chips extends StatelessWidget {
  final List<String> items;
  final IconData? icon;
  const _Chips({required this.items, this.icon});

  @override
  Widget build(BuildContext context) => Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          for (final item in items)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLow,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[Icon(icon, size: 14, color: AppColors.onSurfaceVariant), const SizedBox(width: 4)],
                  Flexible(child: Text(item, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500))),
                ],
              ),
            ),
        ],
      );
}

// ── Contact ───────────────────────────────────────────────────────────────

class _Channel {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _Channel(this.icon, this.label, this.onTap);
}

/// Call / Email / Website / Message as equal tiles (wrapping on small phones).
class _ChannelRow extends StatelessWidget {
  final List<_Channel> channels;
  const _ChannelRow({required this.channels});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, constraints) {
      final perRow = channels.length.clamp(1, 4);
      const gap = 8.0;
      final width = (constraints.maxWidth - gap * (perRow - 1)) / perRow;
      return Wrap(
        spacing: gap,
        runSpacing: gap,
        children: [
          for (final c in channels)
            SizedBox(
              width: width,
              child: Material(
                color: AppColors.surfaceContainerLow,
                borderRadius: BorderRadius.circular(14),
                child: InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: c.onTap,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
                    child: Column(
                      children: [
                        Icon(c.icon, size: 22, color: AppColors.primary),
                        const SizedBox(height: 6),
                        Text(c.label,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      );
    });
  }
}

class _SocialButton extends StatelessWidget {
  final String network;
  final String label;
  final VoidCallback onTap;
  const _SocialButton({required this.network, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => Tooltip(
        message: label,
        child: Semantics(
          button: true,
          label: label,
          child: Material(
            color: Colors.white,
            shape: const CircleBorder(side: BorderSide(color: AppColors.surfaceContainerHigh)),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: onTap,
              child: SizedBox(
                width: 46,
                height: 46,
                child: Center(child: SvgPicture.asset('assets/social/$network.svg', width: 20, height: 20)),
              ),
            ),
          ),
        ),
      );
}

class _ContactBar extends StatelessWidget {
  final VoidCallback? onWhatsApp;
  final VoidCallback? onCall;
  final VoidCallback onMessage;
  const _ContactBar({required this.onWhatsApp, required this.onCall, required this.onMessage});

  @override
  Widget build(BuildContext context) {
    final primary = onWhatsApp != null
        ? ElevatedButton.icon(
            onPressed: onWhatsApp,
            icon: const Icon(Icons.chat, size: 20),
            label: Text('agentProfile.whatsapp'.tr()),
            style: ElevatedButton.styleFrom(backgroundColor: whatsappGreen, foregroundColor: Colors.white),
          )
        : onCall != null
            ? ElevatedButton.icon(onPressed: onCall, icon: const Icon(Icons.call, size: 20), label: Text('agentProfile.call'.tr()))
            : ElevatedButton.icon(
                onPressed: onMessage, icon: const Icon(Icons.chat_bubble_outline, size: 20), label: Text('agentProfile.message'.tr()));

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Color(0x14000000), blurRadius: 12, offset: Offset(0, -2))],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
          child: Row(
            children: [
              if (onWhatsApp != null && onCall != null) ...[
                SizedBox(
                  height: 52,
                  width: 52,
                  child: OutlinedButton(
                    onPressed: onCall,
                    style: OutlinedButton.styleFrom(padding: EdgeInsets.zero, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                    child: Tooltip(message: 'agentProfile.call'.tr(), child: const Icon(Icons.call_outlined)),
                  ),
                ),
                const SizedBox(width: 10),
              ],
              Expanded(child: SizedBox(height: 52, child: primary)),
            ],
          ),
        ),
      ),
    );
  }
}
