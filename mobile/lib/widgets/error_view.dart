import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';

class ErrorView extends StatelessWidget {
  final String? message;
  final VoidCallback onRetry;

  const ErrorView({super.key, this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off_rounded, size: 40, color: AppColors.outline),
            const SizedBox(height: 12),
            Text(
              message ?? 'common.somethingWentWrong'.tr(),
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.onSurfaceVariant),
            ),
            const SizedBox(height: 16),
            OutlinedButton(onPressed: onRetry, child: Text('common.retry'.tr())),
          ],
        ),
      ),
    );
  }
}

class EmptyView extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? body;

  const EmptyView({super.key, required this.icon, required this.title, this.body});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 40, color: AppColors.outline),
            const SizedBox(height: 12),
            Text(title, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w600)),
            if (body != null) ...[
              const SizedBox(height: 6),
              Text(body!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.onSurfaceVariant)),
            ],
          ],
        ),
      ),
    );
  }
}
