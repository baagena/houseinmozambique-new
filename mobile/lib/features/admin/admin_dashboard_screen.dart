import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/auth_controller.dart';
import '../../core/theme/app_theme.dart';
import '../../repositories/admin_repository.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final agent = ref.watch(authControllerProvider).agent;
    final pendingAsync = ref.watch(adminPendingPropertiesProvider);

    final sections = <_AdminSection>[
      _AdminSection(
        icon: Icons.fact_check_outlined,
        label: 'Approvals',
        subtitle: 'Review pending listings',
        badge: pendingAsync.maybeWhen(data: (p) => p.isNotEmpty ? '${p.length}' : null, orElse: () => null),
        color: AppColors.tertiary,
        onTap: () => context.push('/admin/approvals'),
      ),
      _AdminSection(
        icon: Icons.groups_outlined,
        label: 'Agents',
        subtitle: 'Manage agent accounts',
        color: AppColors.primary,
        onTap: () => context.push('/admin/agents'),
      ),
      _AdminSection(
        icon: Icons.home_work_outlined,
        label: 'Properties',
        subtitle: 'All platform listings',
        color: AppColors.primary,
        onTap: () => context.push('/admin/properties'),
      ),
      _AdminSection(
        icon: Icons.campaign_outlined,
        label: 'Ads',
        subtitle: 'Sponsored placements',
        color: AppColors.secondary,
        onTap: () => context.push('/admin/ads'),
      ),
      _AdminSection(
        icon: Icons.article_outlined,
        label: 'Blog',
        subtitle: 'Articles & news',
        color: AppColors.secondary,
        onTap: () => context.push('/admin/blog'),
      ),
      _AdminSection(
        icon: Icons.notifications_active_outlined,
        label: 'Activity',
        subtitle: 'Messages & signups',
        color: AppColors.tertiary,
        onTap: () => context.push('/admin/activities'),
      ),
      _AdminSection(
        icon: Icons.settings_outlined,
        label: 'Settings',
        subtitle: 'Platform preferences',
        color: AppColors.onSurfaceVariant,
        onTap: () => context.push('/admin/settings'),
      ),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Admin Console')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(adminPendingPropertiesProvider),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (agent != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Text(
                  'Welcome back, ${agent.name}',
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: sections.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.15,
              ),
              itemBuilder: (context, i) => _AnimatedSectionCard(section: sections[i], index: i),
            ),
          ],
        ),
      ),
    );
  }
}

class _AdminSection {
  final IconData icon;
  final String label;
  final String subtitle;
  final String? badge;
  final Color color;
  final VoidCallback onTap;

  _AdminSection({
    required this.icon,
    required this.label,
    required this.subtitle,
    this.badge,
    required this.color,
    required this.onTap,
  });
}

class _AnimatedSectionCard extends StatefulWidget {
  final _AdminSection section;
  final int index;
  const _AnimatedSectionCard({required this.section, required this.index});

  @override
  State<_AnimatedSectionCard> createState() => _AnimatedSectionCardState();
}

class _AnimatedSectionCardState extends State<_AnimatedSectionCard> with SingleTickerProviderStateMixin {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final s = widget.section;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: 260 + widget.index * 40),
      curve: Curves.easeOutCubic,
      builder: (context, value, child) {
        return Opacity(
          opacity: value,
          child: Transform.translate(offset: Offset(0, (1 - value) * 12), child: child),
        );
      },
      child: GestureDetector(
        onTapDown: (_) => setState(() => _pressed = true),
        onTapUp: (_) => setState(() => _pressed = false),
        onTapCancel: () => setState(() => _pressed = false),
        onTap: s.onTap,
        child: AnimatedScale(
          scale: _pressed ? 0.96 : 1,
          duration: const Duration(milliseconds: 100),
          child: Card(
            margin: EdgeInsets.zero,
            child: Stack(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: s.color.withValues(alpha: 0.12), shape: BoxShape.circle),
                        child: Icon(s.icon, color: s.color),
                      ),
                      const Spacer(),
                      Text(s.label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                      const SizedBox(height: 2),
                      Text(s.subtitle, style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 11)),
                    ],
                  ),
                ),
                if (s.badge != null)
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(color: AppColors.error, borderRadius: BorderRadius.circular(10)),
                      child: Text(s.badge!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
