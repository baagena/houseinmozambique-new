import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/theme/app_theme.dart';
import 'agent_required_sheet.dart';

/// Bottom-nav slot index (of 5 visual slots) that triggers the post-a-house
/// flow instead of switching branches. The shell has only 4 real branches
/// (Home, Explore, Agents, Profile); this slot sits between Explore and
/// Agents but maps to no branch of its own.
const _postHouseSlot = 2;

int _slotForBranch(int branchIndex) => branchIndex < _postHouseSlot ? branchIndex : branchIndex + 1;

int _branchForSlot(int slot) => slot < _postHouseSlot ? slot : slot - 1;

class AppShell extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;
  const AppShell({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 180),
        child: navigationShell,
      ),
      bottomNavigationBar: _BottomNav(
        selectedSlot: _slotForBranch(navigationShell.currentIndex),
        onSlotSelected: (slot) {
          HapticFeedback.selectionClick();
          if (slot == _postHouseSlot) {
            requireAgent(context, ref, redirectTo: '/dashboard/listings/new');
            return;
          }
          final branchIndex = _branchForSlot(slot);
          navigationShell.goBranch(branchIndex, initialLocation: branchIndex == navigationShell.currentIndex);
        },
      ),
    );
  }
}

class _BottomNav extends StatelessWidget {
  final int selectedSlot;
  final ValueChanged<int> onSlotSelected;
  const _BottomNav({required this.selectedSlot, required this.onSlotSelected});

  static const _items = [
    (icon: Icons.home_outlined, selectedIcon: Icons.home, labelKey: 'nav.home', isAction: false),
    (icon: Icons.search_outlined, selectedIcon: Icons.search, labelKey: 'nav.explore', isAction: false),
    (icon: Icons.add_home_outlined, selectedIcon: Icons.add_home_outlined, labelKey: 'home.postHouse', isAction: true),
    (icon: Icons.groups_outlined, selectedIcon: Icons.groups, labelKey: 'nav.agents', isAction: false),
    (icon: Icons.person_outline, selectedIcon: Icons.person, labelKey: 'nav.profile', isAction: false),
  ];

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
            children: List.generate(_items.length, (i) {
              final item = _items[i];
              return _NavItem(
                icon: item.icon,
                selectedIcon: item.selectedIcon,
                label: item.labelKey.tr(),
                selected: i == selectedSlot,
                isAction: item.isAction,
                onTap: () => onSlotSelected(i),
              );
            }),
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
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.selected,
    required this.isAction,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final highlighted = selected || isAction;
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
                child: Icon(
                  selected ? selectedIcon : icon,
                  size: 22,
                  color: isAction
                      ? Colors.white
                      : (selected ? AppColors.onSecondaryContainer : AppColors.onSurfaceVariant),
                ),
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
