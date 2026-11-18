import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/auth_controller.dart';
import '../../controllers/favorites_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/legal_links.dart';
import '../../core/utils/store_policy.dart';
import '../../models/agent.dart';
import '../../repositories/agent_dashboard_repository.dart';
import '../../services/firebase_services.dart';

/// The Profile tab: one layout for every account. What a person can do decides
/// which rows appear (someone who lists property gets the listing tools, an
/// admin gets the console) — nobody is shown a "customer" or "agent" label,
/// and there is a single sign-in and a single sign-up for everyone.
class ProfileTabScreen extends ConsumerWidget {
  const ProfileTabScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final agent = ref.watch(authControllerProvider).agent;
    final favoritesCount = ref.watch(favoritesControllerProvider).length;
    final listsProperty = agent != null && agent.isAgent;
    // Counts are decoration: while loading, or if a request fails, show a dash.
    final listings = listsProperty ? ref.watch(myPropertiesProvider).asData?.value.length : null;
    final unreadLeads = listsProperty ? ref.watch(myLeadsProvider).asData?.value.$2 : null;
    final language = Localizations.localeOf(context).languageCode == 'pt'
        ? 'settings.portuguese'.tr()
        : 'settings.english'.tr();

    return AnnotatedRegion<SystemUiOverlayStyle>(
      // The header is dark blue, so the status bar icons go light on this tab.
      value: SystemUiOverlayStyle.light.copyWith(statusBarColor: Colors.transparent),
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: ListView(
          padding: EdgeInsets.zero,
          children: [
            _Header(
              agent: agent,
              stats: [
                if (listsProperty)
                  _Stat(
                    value: listings?.toString() ?? '–',
                    label: 'nav.listings'.tr(),
                    onTap: () => context.push('/dashboard/listings'),
                  ),
                if (listsProperty)
                  _Stat(
                    value: unreadLeads?.toString() ?? '–',
                    label: 'nav.leads'.tr(),
                    onTap: () => context.push('/dashboard/leads'),
                  ),
                _Stat(
                  value: '$favoritesCount',
                  label: 'nav.favorites'.tr(),
                  onTap: () => context.push('/favorites'),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 120),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (listsProperty) ...[
                    _GroupTitle('profile.myProperty'.tr()),
                    _Group(children: [
                      _Row(
                        icon: Icons.dashboard_outlined,
                        color: AppColors.primary,
                        label: 'dashboard.title'.tr(),
                        onTap: () => context.push('/dashboard'),
                      ),
                      _Row(
                        icon: Icons.home_work_outlined,
                        color: AppColors.secondary,
                        label: 'dashboard.myListings'.tr(),
                        onTap: () => context.push('/dashboard/listings'),
                      ),
                      _Row(
                        icon: Icons.inbox_outlined,
                        color: const Color(0xFF0F766E),
                        label: 'dashboard.leads'.tr(),
                        badge: (unreadLeads ?? 0) > 0 ? '$unreadLeads' : null,
                        onTap: () => context.push('/dashboard/leads'),
                      ),
                      _Row(
                        icon: Icons.person_search_outlined,
                        color: const Color(0xFF7C3AED),
                        label: 'dash.buyersLooking'.tr(),
                        onTap: () => context.push('/dashboard/requests'),
                      ),
                      // Admins don't pay; nothing to bill.
                      if (showsPaidPlans && !agent.isAdmin)
                        _Row(
                          icon: Icons.payments_outlined,
                          color: const Color(0xFF166534),
                          label: 'dash.billing'.tr(),
                          onTap: () => context.push('/dashboard/billing'),
                        ),
                      if (agent.isAdmin)
                        _Row(
                          icon: Icons.admin_panel_settings_outlined,
                          color: AppColors.tertiary,
                          label: 'settings.adminConsole'.tr(),
                          onTap: () => context.push('/admin'),
                        ),
                    ]),
                    const SizedBox(height: 20),
                  ] else ...[
                    _ListPropertyCard(
                      onTap: () => context.push('/agent-register', extra: {'accountType': 'AGENT'}),
                    ),
                    const SizedBox(height: 20),
                  ],
                  _GroupTitle('profile.account'.tr()),
                  _Group(children: [
                    if (listsProperty)
                      _Row(
                        icon: Icons.person_outline,
                        color: AppColors.primary,
                        label: 'settings.editProfile'.tr(),
                        onTap: () => context.push('/dashboard/profile'),
                      ),
                    _Row(
                      icon: Icons.favorite_outline,
                      color: const Color(0xFFBE123C),
                      label: 'nav.favorites'.tr(),
                      badge: favoritesCount > 0 ? '$favoritesCount' : null,
                      onTap: () => context.push('/favorites'),
                    ),
                    if (listsProperty && firebaseReady) const _PushToggleRow(),
                    _Row(
                      icon: Icons.language,
                      color: const Color(0xFF0369A1),
                      label: 'settings.language'.tr(),
                      value: language,
                      onTap: () => context.push('/settings'),
                    ),
                  ]),
                  const SizedBox(height: 20),
                  _GroupTitle('profile.support'.tr()),
                  _Group(children: [
                    _Row(
                      icon: Icons.support_agent_outlined,
                      color: AppColors.secondary,
                      label: 'settings.helpContact'.tr(),
                      onTap: () => context.push('/contact'),
                    ),
                    _Row(
                      icon: Icons.description_outlined,
                      color: AppColors.onSurfaceVariant,
                      label: 'settings.termsOfService'.tr(),
                      external: true,
                      onTap: openTermsOfService,
                    ),
                    _Row(
                      icon: Icons.privacy_tip_outlined,
                      color: AppColors.onSurfaceVariant,
                      label: 'settings.privacyPolicy'.tr(),
                      external: true,
                      onTap: openPrivacyPolicy,
                    ),
                  ]),
                  if (agent != null) ...[
                    const SizedBox(height: 24),
                    OutlinedButton.icon(
                      onPressed: () => _confirmSignOut(context, ref),
                      icon: const Icon(Icons.logout, size: 18),
                      label: Text('common.logout'.tr()),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: BorderSide(color: AppColors.error.withValues(alpha: 0.4)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                    if (!agent.isAdmin)
                      TextButton(
                        onPressed: () => _confirmDeleteAccount(context),
                        child: Text(
                          'settings.deleteAccount'.tr(),
                          style: const TextStyle(color: AppColors.outline, fontSize: 13),
                        ),
                      ),
                  ],
                  const SizedBox(height: 12),
                  Text(
                    appVersion.isEmpty ? 'House in Mozambique' : 'House in Mozambique · v$appVersion',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 12, color: AppColors.outline),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

Future<void> _confirmSignOut(BuildContext context, WidgetRef ref) async {
  final ok = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text('common.logout'.tr()),
      content: Text('profile.signOutConfirm'.tr()),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('common.cancel'.tr())),
        TextButton(
          onPressed: () => Navigator.pop(ctx, true),
          child: Text('common.logout'.tr(), style: const TextStyle(color: AppColors.error)),
        ),
      ],
    ),
  );
  if (ok == true) await ref.read(authControllerProvider.notifier).logout();
}

Future<void> _confirmDeleteAccount(BuildContext context) async {
  final deleted = await showDialog<bool>(
    context: context,
    builder: (_) => const _DeleteAccountDialog(),
  );
  if (deleted == true && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('settings.accountDeleted'.tr())));
  }
}

// ── Header ───────────────────────────────────────────────────────────────────

class _Stat {
  final String value;
  final String label;
  final VoidCallback onTap;
  const _Stat({required this.value, required this.label, required this.onTap});
}

class _Header extends StatelessWidget {
  final Agent? agent;
  final List<_Stat> stats;
  const _Header({required this.agent, required this.stats});

  @override
  Widget build(BuildContext context) {
    final a = agent;
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.primaryContainer],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(3),
                    decoration: const BoxDecoration(color: Colors.white24, shape: BoxShape.circle),
                    child: CircleAvatar(
                      radius: 32,
                      backgroundColor: AppColors.secondaryContainer,
                      backgroundImage: a?.avatar != null ? CachedNetworkImageProvider(a!.avatar!) : null,
                      // Offline or a broken link: keep the plain circle, no error.
                      onBackgroundImageError: a?.avatar != null ? (_, __) {} : null,
                      child: a?.avatar != null
                          ? null
                          : a == null
                              ? const Icon(Icons.person, size: 34, color: AppColors.onSecondaryContainer)
                              : Text(
                                  a.initials,
                                  style: const TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.onSecondaryContainer,
                                  ),
                                ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                a?.name ?? 'settings.guestTitle'.tr(),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700),
                              ),
                            ),
                            if (a?.isVerified == true) ...[
                              const SizedBox(width: 6),
                              const Icon(Icons.verified, size: 18, color: AppColors.secondaryContainer),
                            ],
                          ],
                        ),
                        const SizedBox(height: 3),
                        Text(
                          a == null ? 'profile.guestBody'.tr() : (a.email ?? a.location),
                          maxLines: a == null ? 3 : 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.3),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              if (a == null) ...[
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: AppColors.primary,
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
                        ),
                        onPressed: () => context.push('/agent-login'),
                        child: Text('auth.signIn'.tr(), maxLines: 1, overflow: TextOverflow.ellipsis),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: Colors.white70),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () => context.push('/agent-register', extra: {'accountType': 'CUSTOMER'}),
                        child: Text('auth.register'.tr(), maxLines: 1, overflow: TextOverflow.ellipsis),
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 18),
              Container(
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: IntrinsicHeight(
                  child: Row(
                    children: [
                      for (var i = 0; i < stats.length; i++) ...[
                        if (i > 0) const VerticalDivider(width: 1, indent: 12, endIndent: 12, color: Colors.white24),
                        Expanded(
                          child: InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: stats[i].onTap,
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
                              child: Column(
                                children: [
                                  Text(
                                    stats[i].value,
                                    style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    stats[i].label,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Building blocks ──────────────────────────────────────────────────────────

class _GroupTitle extends StatelessWidget {
  final String text;
  const _GroupTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 6, bottom: 8),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          fontSize: 11.5,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
          color: AppColors.outline,
        ),
      ),
    );
  }
}

/// A white rounded card holding rows, with hairlines between them.
class _Group extends StatelessWidget {
  final List<Widget> children;
  const _Group({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, 4)),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: Column(
          children: [
            for (var i = 0; i < children.length; i++) ...[
              if (i > 0) const Divider(height: 1, indent: 66, color: AppColors.surfaceContainer),
              children[i],
            ],
          ],
        ),
      ),
    );
  }
}

class _IconTile extends StatelessWidget {
  final IconData icon;
  final Color color;
  const _IconTile({required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 38,
      height: 38,
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(11)),
      child: Icon(icon, size: 20, color: color),
    );
  }
}

class _Row extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final VoidCallback onTap;
  final String? badge;
  final String? value;
  final bool external;
  const _Row({
    required this.icon,
    required this.color,
    required this.label,
    required this.onTap,
    this.badge,
    this.value,
    this.external = false,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
        child: Row(
          children: [
            _IconTile(icon: icon, color: color),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
              ),
            ),
            if (value != null)
              Flexible(
                child: Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: Text(
                    value!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 13, color: AppColors.outline),
                  ),
                ),
              ),
            if (badge != null)
              Container(
                margin: const EdgeInsets.only(left: 8),
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                decoration: BoxDecoration(color: AppColors.secondaryContainer, borderRadius: BorderRadius.circular(12)),
                child: Text(
                  badge!,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.onSecondaryContainer),
                ),
              ),
            const SizedBox(width: 6),
            Icon(external ? Icons.open_in_new : Icons.chevron_right, size: external ? 16 : 20, color: AppColors.outlineVariant),
          ],
        ),
      ),
    );
  }
}

/// Shown to anyone who is not listing property yet (signed in or not).
class _ListPropertyCard extends StatelessWidget {
  final VoidCallback onTap;
  const _ListPropertyCard({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.secondaryContainer.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.secondaryContainer),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: const BoxDecoration(color: AppColors.secondary, shape: BoxShape.circle),
            child: const Icon(Icons.add_home_outlined, color: Colors.white),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('profile.listTitle'.tr(), style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700)),
                const SizedBox(height: 3),
                Text(
                  'profile.listBody'.tr(),
                  style: const TextStyle(fontSize: 12.5, color: AppColors.onSurfaceVariant, height: 1.3),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  height: 38,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.secondary,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                    ),
                    onPressed: onTap,
                    child: Text('profile.listCta'.tr(), maxLines: 1, overflow: TextOverflow.ellipsis),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Push notifications on/off for this phone.
class _PushToggleRow extends ConsumerStatefulWidget {
  const _PushToggleRow();

  @override
  ConsumerState<_PushToggleRow> createState() => _PushToggleRowState();
}

class _PushToggleRowState extends ConsumerState<_PushToggleRow> {
  bool? _enabled;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    pushEnabledPreference().then((v) {
      if (mounted) setState(() => _enabled = v);
    });
  }

  Future<void> _set(bool value) async {
    setState(() {
      _busy = true;
      _enabled = value;
    });
    await ref.read(pushServiceProvider).setEnabled(
          value,
          ref.read(authControllerProvider).agent,
          lang: Localizations.localeOf(context).languageCode,
          appVersion: appVersion,
        );
    if (mounted) setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 6, 8, 6),
      child: Row(
        children: [
          const _IconTile(icon: Icons.notifications_outlined, color: Color(0xFFB45309)),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              'settings.pushNotifications'.tr(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
            ),
          ),
          Switch(value: _enabled ?? true, onChanged: _enabled == null || _busy ? null : _set),
        ],
      ),
    );
  }
}

class _DeleteAccountDialog extends ConsumerStatefulWidget {
  const _DeleteAccountDialog();

  @override
  ConsumerState<_DeleteAccountDialog> createState() => _DeleteAccountDialogState();
}

class _DeleteAccountDialogState extends ConsumerState<_DeleteAccountDialog> {
  final _passwordController = TextEditingController();
  bool _deleting = false;
  String? _error;

  @override
  void dispose() {
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _delete() async {
    if (_passwordController.text.isEmpty) {
      setState(() => _error = 'auth.passwordRequired'.tr());
      return;
    }
    setState(() {
      _deleting = true;
      _error = null;
    });
    try {
      await ref.read(authControllerProvider.notifier).deleteAccount(_passwordController.text);
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) {
        setState(() {
          _deleting = false;
          _error = e.asApiException?.message ?? 'common.somethingWentWrong'.tr();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('settings.deleteAccountTitle'.tr()),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('settings.deleteAccountBody'.tr(), style: const TextStyle(fontSize: 13.5, color: AppColors.onSurfaceVariant)),
          const SizedBox(height: 16),
          TextField(
            controller: _passwordController,
            obscureText: true,
            enabled: !_deleting,
            decoration: InputDecoration(labelText: 'auth.password'.tr(), errorText: _error),
            onSubmitted: (_) => _delete(),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: _deleting ? null : () => Navigator.of(context).pop(false),
          child: Text('settings.cancel'.tr()),
        ),
        TextButton(
          onPressed: _deleting ? null : _delete,
          style: TextButton.styleFrom(foregroundColor: AppColors.error),
          child: _deleting
              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
              : Text('settings.deleteAccountConfirm'.tr()),
        ),
      ],
    );
  }
}
