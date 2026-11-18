import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';

/// A screen that could not load. It retries by itself — every few seconds,
/// and straight away when the person comes back to the app — so when the
/// connection returns the page simply appears, without having to find and
/// press "Try again" (which stays, for anyone who wants it).
class ErrorView extends StatefulWidget {
  final String? message;
  final VoidCallback onRetry;

  /// Off for places where retrying by itself would be wrong.
  final bool autoRetry;

  const ErrorView({super.key, this.message, required this.onRetry, this.autoRetry = true});

  @override
  State<ErrorView> createState() => _ErrorViewState();
}

class _ErrorViewState extends State<ErrorView> with WidgetsBindingObserver {
  // A retry shows a loader and, if it fails again, a new ErrorView. These
  // carry the back-off across those instances: 4s, 8s, 16s, then every 30s.
  static int _streak = 0;
  static DateTime? _lastFailure;

  Timer? _timer;

  @override
  void initState() {
    super.initState();
    if (!widget.autoRetry) return;
    WidgetsBinding.instance.addObserver(this);
    final now = DateTime.now();
    final recent = _lastFailure != null && now.difference(_lastFailure!) < const Duration(minutes: 1);
    _streak = recent ? _streak + 1 : 0;
    _lastFailure = now;
    final seconds = (4 << _streak.clamp(0, 3)).clamp(4, 30);
    _timer = Timer(Duration(seconds: seconds), _retry);
  }

  void _retry() {
    _timer?.cancel();
    if (mounted) widget.onRetry();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Back from the settings app after turning Wi-Fi on: try now.
    if (state == AppLifecycleState.resumed) {
      _streak = 0;
      _retry();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

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
              widget.message ?? 'common.somethingWentWrong'.tr(),
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.onSurfaceVariant),
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () {
                _streak = 0;
                _retry();
              },
              child: Text('common.retry'.tr()),
            ),
            if (widget.autoRetry) ...[
              const SizedBox(height: 10),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.autorenew, size: 14, color: AppColors.outline),
                  const SizedBox(width: 6),
                  Flexible(
                    child: Text(
                      'common.retryingAutomatically'.tr(),
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 12, color: AppColors.outline),
                    ),
                  ),
                ],
              ),
            ],
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
    final content = Center(
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
    // Filling a screen (usually inside a RefreshIndicator): make it
    // scrollable, or pull-to-refresh does nothing on an empty list and the
    // person has no way to check again. Inside another list it stays as is.
    return LayoutBuilder(
      builder: (context, constraints) {
        if (!constraints.hasBoundedHeight) return content;
        return SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: content,
          ),
        );
      },
    );
  }
}
