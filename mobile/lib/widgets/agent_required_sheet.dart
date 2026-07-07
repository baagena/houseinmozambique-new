import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../controllers/auth_controller.dart';
import '../core/theme/app_theme.dart';

/// Entry point for any action that requires an agent account (e.g. posting a
/// listing). Signed-in agents go straight through; everyone else sees a sheet
/// explaining why, with a clear path to sign in or create an account —
/// instead of silently redirecting to a login form with no context.
void requireAgent(BuildContext context, WidgetRef ref, {required String redirectTo}) {
  final isAuthenticated = ref.read(authControllerProvider).status == AuthStatus.authenticated;
  if (isAuthenticated) {
    context.push(redirectTo);
    return;
  }
  showModalBottomSheet(
    context: context,
    backgroundColor: Colors.transparent,
    builder: (context) => _AgentRequiredSheet(redirectTo: redirectTo),
  );
}

class _AgentRequiredSheet extends StatelessWidget {
  final String redirectTo;
  const _AgentRequiredSheet({required this.redirectTo});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        margin: const EdgeInsets.all(12),
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(color: AppColors.secondaryContainer, shape: BoxShape.circle),
              child: const Icon(Icons.real_estate_agent_outlined, color: AppColors.onSecondaryContainer, size: 26),
            ),
            const SizedBox(height: 16),
            Text('postHouse.signInRequired'.tr(), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(
              'postHouse.signInRequiredBody'.tr(),
              style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13.5),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  context.push('/agent-login', extra: redirectTo);
                },
                child: Text('auth.signIn'.tr()),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  context.push('/agent-register', extra: redirectTo);
                },
                child: Text('auth.registerTitle'.tr()),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
