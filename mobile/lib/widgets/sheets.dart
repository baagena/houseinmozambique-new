import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';

/// The top of every sheet: a title and a visible close button. Swiping down
/// is not discoverable on its own, so nothing in the app relies on it.
class SheetTitle extends StatelessWidget {
  final String title;
  final String? subtitle;

  /// Defaults to popping the sheet.
  final VoidCallback? onClose;
  const SheetTitle(this.title, {super.key, this.subtitle, this.onClose});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(
                    title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 19, fontWeight: FontWeight.bold),
                  ),
                ),
                if (subtitle != null)
                  Text(
                    subtitle!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: AppColors.onSurfaceVariant),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          SheetCloseButton(onClose: onClose),
        ],
      ),
    );
  }
}

class SheetCloseButton extends StatelessWidget {
  final VoidCallback? onClose;
  const SheetCloseButton({super.key, this.onClose});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surfaceContainer,
      shape: const CircleBorder(),
      child: IconButton(
        tooltip: 'common.close'.tr(),
        visualDensity: VisualDensity.compact,
        icon: const Icon(Icons.close, size: 20),
        onPressed: onClose ?? () => Navigator.of(context).maybePop(),
      ),
    );
  }
}

/// A form shown as a sheet on its own route (contact, post a listing).
///
/// Unlike a modal bottom sheet, a route has no built-in ways out, and these
/// had none a person could see: tapping the dimmed area above did nothing, and
/// dragging down only shrank the sheet to half height. Here both close it —
/// through [onClose], so a long form can ask before discarding.
class RouteSheet extends StatefulWidget {
  final double initialSize;
  final double maxSize;
  final VoidCallback onClose;
  final Widget Function(BuildContext context, ScrollController controller) builder;
  const RouteSheet({
    super.key,
    this.initialSize = 0.88,
    this.maxSize = 0.96,
    required this.onClose,
    required this.builder,
  });

  @override
  State<RouteSheet> createState() => _RouteSheetState();
}

class _RouteSheetState extends State<RouteSheet> {
  static const _minSize = 0.3;
  final _controller = DraggableScrollableController();
  bool _closing = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  /// Dragged most of the way down: treat it as "close". If [onClose] asks a
  /// question and the answer is "keep editing", the sheet springs back.
  bool _onDrag(DraggableScrollableNotification n) {
    if (!_closing && n.extent <= _minSize + 0.08) {
      _closing = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        widget.onClose();
        Future<void>.delayed(const Duration(milliseconds: 400), () {
          if (!mounted) return;
          _closing = false;
          if (_controller.isAttached) {
            _controller.animateTo(widget.initialSize,
                duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
          }
        });
      });
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      type: MaterialType.transparency,
      child: Stack(
        children: [
          // The dimmed area above the sheet.
          Positioned.fill(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: widget.onClose,
              child: Semantics(label: 'common.close'.tr(), button: true),
            ),
          ),
          AnimatedPadding(
            duration: const Duration(milliseconds: 180),
            curve: Curves.easeOut,
            padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
            child: Align(
              alignment: Alignment.bottomCenter,
              child: NotificationListener<DraggableScrollableNotification>(
                onNotification: _onDrag,
                child: DraggableScrollableSheet(
                  controller: _controller,
                  initialChildSize: widget.initialSize,
                  minChildSize: _minSize,
                  maxChildSize: widget.maxSize,
                  expand: false,
                  builder: (context, scrollController) => Container(
                    clipBehavior: Clip.antiAlias,
                    decoration: const BoxDecoration(
                      color: AppColors.surfaceContainerLowest,
                      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                    ),
                    child: widget.builder(context, scrollController),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
