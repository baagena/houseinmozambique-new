import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../controllers/auth_controller.dart';
import '../core/theme/app_theme.dart';
import '../repositories/agent_dashboard_repository.dart';
import 'agent_required_sheet.dart';

/// One slot in the bottom nav. `branchIndex` maps to a StatefulShellBranch in
/// app_router.dart; a null branchIndex is the center post-a-house action.
class _NavEntry {
  final IconData icon;
  final IconData selectedIcon;
  final String labelKey;
  final int? branchIndex;
  const _NavEntry(this.icon, this.selectedIcon, this.labelKey, this.branchIndex);

  bool get isAction => branchIndex == null;
}

// Branch indices (see app_router.dart): 0 home, 1 explore, 2 agents,
// 3 profile, 4 my-listings, 5 my-leads.
const _guestEntries = [
  _NavEntry(Icons.home_outlined, Icons.home, 'nav.home', 0),
  _NavEntry(Icons.search_outlined, Icons.search, 'nav.explore', 1),
  _NavEntry(Icons.add_home_outlined, Icons.add_home_outlined, 'home.postHouse', null),
  _NavEntry(Icons.groups_outlined, Icons.groups, 'nav.agents', 2),
  _NavEntry(Icons.person_outline, Icons.person, 'nav.profile', 3),
];

// Agents work, not browse: their tabs manage listings and leads instead of
// the public Explore/Agents directory.
const _agentEntries = [
  _NavEntry(Icons.home_outlined, Icons.home, 'nav.home', 0),
  _NavEntry(Icons.home_work_outlined, Icons.home_work, 'nav.listings', 4),
  _NavEntry(Icons.add_home_outlined, Icons.add_home_outlined, 'home.postHouse', null),
  _NavEntry(Icons.inbox_outlined, Icons.inbox, 'nav.leads', 5),
  _NavEntry(Icons.person_outline, Icons.person, 'nav.profile', 3),
];

class AppShell extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;
  const AppShell({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final agent = ref.watch(authControllerProvider).agent;
    final isAgent = agent != null && agent.isAgent;
    final entries = isAgent ? _agentEntries : _guestEntries;
    // Unread-leads badge for agents; errors just hide the badge.
    final unreadLeads = isAgent ? (ref.watch(myLeadsProvider).asData?.value.$2 ?? 0) : 0;

    return Scaffold(
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 180),
        child: navigationShell,
      ),
      bottomNavigationBar: _BottomNav(
        entries: entries,
        currentBranch: navigationShell.currentIndex,
        unreadLeads: unreadLeads,
        onEntrySelected: (entry) {
          HapticFeedback.selectionClick();
          if (entry.isAction) {
            requireAgent(context, ref, redirectTo: '/dashboard/listings/new');
            return;
          }
          navigationShell.goBranch(
            entry.branchIndex!,
            initialLocation: entry.branchIndex == navigationShell.currentIndex,
          );
        },
      ),
    );
  }
}

class _BottomNav extends StatelessWidget {
  final List<_NavEntry> entries;
  final int currentBranch;
  final int unreadLeads;
  final ValueChanged<_NavEntry> onEntrySelected;
  const _BottomNav({
    required this.entries,
    required this.currentBranch,
    required this.unreadLeads,
    required this.onEntrySelected,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 16, offset: const Offset(0, -4)),
        ],
      ),
      child: SafeArea(
        child: SizedBox(
          height: 64,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: entries.map((entry) {
              return _NavItem(
                icon: entry.icon,
                selectedIcon: entry.selectedIcon,
                label: entry.labelKey.tr(),
                selected: entry.branchIndex != null && entry.branchIndex == currentBranch,
                isAction: entry.isAction,
                badgeCount: entry.labelKey == 'nav.leads' ? unreadLeads : 0,
                onTap: () => onEntrySelected(entry),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final bool selected;
  final bool isAction;
  final int badgeCount;
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.selected,
    required this.isAction,
    required this.badgeCount,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final highlighted = selected || isAction;
    final iconWidget = Icon(
      selected ? selectedIcon : icon,
      size: 22,
      color: isAction
          ? Colors.white
          : (selected ? AppColors.onSecondaryContainer : AppColors.onSurfaceVariant),
    );
    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedScale(
              scale: highlighted ? 1.15 : 1.0,
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOutBack,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
                decoration: BoxDecoration(
                  color: isAction
                      ? AppColors.secondary
                      : (selected ? AppColors.secondaryContainer : Colors.transparent),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: badgeCount > 0
                    ? Badge.count(count: badgeCount, child: iconWidget)
                    : iconWidget,
              ),
            ),
            const SizedBox(height: 4),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 200),
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: highlighted ? FontWeight.w700 : FontWeight.w500,
                color: highlighted ? AppColors.primary : AppColors.onSurfaceVariant,
              ),
              child: Text(label),
            ),
          ],
        ),
      ),
    );
  }
}
