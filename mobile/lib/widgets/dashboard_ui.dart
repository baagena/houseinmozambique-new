import 'dart:convert';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../core/network/api_client.dart';
import '../core/theme/app_theme.dart';
import '../core/utils/json.dart';
import '../repositories/agent_dashboard_repository.dart';

/// Shared building blocks for the agent and admin dashboard screens.

/// Runs a server action, shows the result as a snack bar, and never lets an
/// exception escape into the framework (an unhandled one is a crash report
/// and, in review, a rejection). Returns true on success.
///
/// [errorText] replaces the server's message for a failure — used on iOS,
/// where server text that mentions plans or upgrading must never be shown.
Future<bool> runAction(
  BuildContext context,
  Future<void> Function() action, {
  String? success,
  String? Function(ApiException? error)? errorText,
}) async {
  final messenger = ScaffoldMessenger.maybeOf(context);
  try {
    await action();
    if (success != null) messenger?.showSnackBar(SnackBar(content: Text(success)));
    return true;
  } catch (e) {
    final api = e.asApiException;
    messenger?.showSnackBar(SnackBar(
      content: Text(errorText?.call(api) ?? api?.message ?? 'common.somethingWentWrong'.tr()),
      backgroundColor: AppColors.error,
    ));
    return false;
  }
}

Future<bool> confirmDialog(BuildContext context, {required String title, String? body, String? confirmLabel, bool destructive = false}) async {
  final ok = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(title),
      content: body == null ? null : Text(body),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('common.cancel'.tr())),
        TextButton(
          onPressed: () => Navigator.pop(ctx, true),
          child: Text(confirmLabel ?? 'common.continue'.tr(),
              style: TextStyle(color: destructive ? AppColors.error : null)),
        ),
      ],
    ),
  );
  return ok == true;
}

/// Asks for one line (or a paragraph) of text. Returns null when cancelled.
Future<String?> promptText(
  BuildContext context, {
  required String title,
  String? label,
  String initial = '',
  bool required = false,
  int maxLines = 3,
  String? confirmLabel,
  TextInputType? keyboardType,
}) {
  return showDialog<String>(
    context: context,
    builder: (ctx) => _PromptDialog(
      title: title,
      label: label,
      initial: initial,
      required: required,
      maxLines: maxLines,
      confirmLabel: confirmLabel,
      keyboardType: keyboardType,
    ),
  );
}

class _PromptDialog extends StatefulWidget {
  final String title;
  final String? label;
  final String initial;
  final bool required;
  final int maxLines;
  final String? confirmLabel;
  final TextInputType? keyboardType;
  const _PromptDialog({
    required this.title,
    this.label,
    required this.initial,
    required this.required,
    required this.maxLines,
    this.confirmLabel,
    this.keyboardType,
  });

  @override
  State<_PromptDialog> createState() => _PromptDialogState();
}

class _PromptDialogState extends State<_PromptDialog> {
  late final _controller = TextEditingController(text: widget.initial);
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submit() {
    final v = _controller.text.trim();
    if (widget.required && v.isEmpty) {
      setState(() => _error = 'common.required'.tr());
      return;
    }
    Navigator.pop(context, v);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.title),
      content: TextField(
        controller: _controller,
        autofocus: true,
        minLines: 1,
        maxLines: widget.maxLines,
        keyboardType: widget.keyboardType,
        decoration: InputDecoration(labelText: widget.label, errorText: _error),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text('common.cancel'.tr())),
        TextButton(onPressed: _submit, child: Text(widget.confirmLabel ?? 'common.save'.tr())),
      ],
    );
  }
}

class StatTile extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color? color;
  final VoidCallback? onTap;
  const StatTile({super.key, required this.label, required this.value, required this.icon, this.color, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: color ?? AppColors.primary, size: 22),
              const SizedBox(height: 10),
              FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 2),
              Text(label,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }
}

/// Two tiles per row; each row stretches to its taller tile.
class StatGrid extends StatelessWidget {
  final List<Widget> tiles;
  const StatGrid({super.key, required this.tiles});

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    for (var i = 0; i < tiles.length; i += 2) {
      rows.add(IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(child: tiles[i]),
            const SizedBox(width: 12),
            Expanded(child: i + 1 < tiles.length ? tiles[i + 1] : const SizedBox()),
          ],
        ),
      ));
      if (i + 2 < tiles.length) rows.add(const SizedBox(height: 12));
    }
    return Column(children: rows);
  }
}

class SectionTitle extends StatelessWidget {
  final String text;
  final Widget? trailing;
  const SectionTitle(this.text, {super.key, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 20, bottom: 10),
      child: Row(
        children: [
          Expanded(child: Text(text, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700))),
          ?trailing,
        ],
      ),
    );
  }
}

/// A soft coloured notice box.
class NoticeCard extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color color;
  final Widget? action;
  const NoticeCard({super.key, required this.icon, required this.text, this.color = AppColors.secondary, this.action});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(text, style: const TextStyle(fontSize: 13.5)),
                if (action != null) ...[const SizedBox(height: 6), action!],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// A label/value line, with the value selectable and copyable on long press.
class InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final bool copyable;
  const InfoRow(this.label, this.value, {super.key, this.copyable = false});

  @override
  Widget build(BuildContext context) {
    if (value.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13)),
          ),
          Expanded(child: SelectableText(value, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600))),
          if (copyable)
            InkWell(
              onTap: () {
                Clipboard.setData(ClipboardData(text: value));
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('dash.copied'.tr())));
              },
              child: const Padding(
                padding: EdgeInsets.only(left: 6),
                child: Icon(Icons.copy, size: 16, color: AppColors.outline),
              ),
            ),
        ],
      ),
    );
  }
}

/// Where to send the money, from the admin's payment settings. Only ever
/// shown where `showsPaidPlans` is true (never on iOS).
class PaymentInstructionsCard extends StatelessWidget {
  final Map<String, dynamic> instructions;
  final String? orderRef;
  final int? amountMinor;
  final String currency;
  const PaymentInstructionsCard({
    super.key,
    required this.instructions,
    this.orderRef,
    this.amountMinor,
    this.currency = 'MZN',
  });

  @override
  Widget build(BuildContext context) {
    final i = instructions;
    final hasDestination = i.str('mpesaNumber').isNotEmpty ||
        i.str('emolaNumber').isNotEmpty ||
        i.str('bankAccount').isNotEmpty ||
        i.str('bankIban').isNotEmpty;
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('dash.howToPay'.tr(), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 8),
            if (amountMinor != null) InfoRow('dashboard.amount'.tr(), formatMinor(amountMinor!, currency)),
            if (orderRef != null) InfoRow('dash.reference'.tr(), orderRef!, copyable: true),
            if (!hasDestination)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text('dash.noDestination'.tr(), style: const TextStyle(color: AppColors.error, fontSize: 13)),
              ),
            InfoRow('dashboard.accountName'.tr(), i.str('accountName')),
            InfoRow('M-Pesa', i.str('mpesaNumber'), copyable: true),
            InfoRow('e-Mola', i.str('emolaNumber'), copyable: true),
            InfoRow('dashboard.bankName'.tr(), i.str('bankName')),
            InfoRow('dashboard.accountNumber'.tr(), i.str('bankAccount'), copyable: true),
            InfoRow('IBAN/NIB', i.str('bankIban'), copyable: true),
            if (i.str('notes').isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(i.str('notes'), style: const TextStyle(fontSize: 12.5, color: AppColors.onSurfaceVariant)),
            ],
            if (orderRef != null) ...[
              const SizedBox(height: 8),
              Text('dash.quoteReference'.tr(), style: const TextStyle(fontSize: 12.5, color: AppColors.onSurfaceVariant)),
            ],
          ],
        ),
      ),
    );
  }
}

/// The "I've paid" form: a confirmation code or a screenshot (either is
/// enough), posted to the website's /api/payments/:id/proof.
class PaymentProofForm extends ConsumerStatefulWidget {
  final String paymentId;
  final VoidCallback onSubmitted;
  const PaymentProofForm({super.key, required this.paymentId, required this.onSubmitted});

  @override
  ConsumerState<PaymentProofForm> createState() => _PaymentProofFormState();
}

class _PaymentProofFormState extends ConsumerState<PaymentProofForm> {
  final _reference = TextEditingController();
  final _msisdn = TextEditingController();
  final _note = TextEditingController();
  String? _proofBase64;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _reference.dispose();
    _msisdn.dispose();
    _note.dispose();
    super.dispose();
  }

  Future<void> _pickScreenshot() async {
    try {
      final file = await ImagePicker().pickImage(
        source: ImageSource.gallery,
        imageQuality: 70,
        maxWidth: 1400,
        maxHeight: 1400,
      );
      if (file == null) return;
      final bytes = await file.readAsBytes();
      final mime = file.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      if (!mounted) return;
      setState(() => _proofBase64 = 'data:$mime;base64,${base64Encode(bytes)}');
    } catch (_) {
      if (mounted) setState(() => _error = 'dashboard.imagePickerError'.tr());
    }
  }

  Future<void> _submit() async {
    final reference = _reference.text.trim();
    if (reference.isEmpty && _proofBase64 == null) {
      setState(() => _error = 'dash.proofRequired'.tr());
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(agentDashboardRepositoryProvider).submitPaymentProof(
            widget.paymentId,
            payerReference: reference.isEmpty ? null : reference,
            payerMsisdn: _msisdn.text.trim().isEmpty ? null : _msisdn.text.trim(),
            proofNote: _note.text.trim().isEmpty ? null : _note.text.trim(),
            proofBase64: _proofBase64,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('dash.proofSent'.tr())));
      widget.onSubmitted();
    } catch (e) {
      if (mounted) setState(() => _error = e.asApiException?.message ?? 'common.somethingWentWrong'.tr());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('dash.sendProof'.tr(), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 4),
            Text('dash.sendProofHint'.tr(), style: const TextStyle(fontSize: 12.5, color: AppColors.onSurfaceVariant)),
            const SizedBox(height: 12),
            TextField(
              controller: _reference,
              enabled: !_busy,
              maxLength: 64,
              decoration: InputDecoration(labelText: 'dashboard.transactionRef'.tr(), counterText: ''),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _msisdn,
              enabled: !_busy,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(labelText: 'common.optional'.tr(args: ['dash.paidFromNumber'.tr()])),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _note,
              enabled: !_busy,
              maxLines: 2,
              maxLength: 500,
              decoration: InputDecoration(labelText: 'common.optional'.tr(args: ['dash.note'.tr()]), counterText: ''),
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: _busy ? null : _pickScreenshot,
              icon: Icon(_proofBase64 == null ? Icons.image_outlined : Icons.check_circle, size: 18),
              label: Text(_proofBase64 == null ? 'dash.attachScreenshot'.tr() : 'dash.screenshotAttached'.tr()),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
            ],
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _busy ? null : _submit,
              child: _busy
                  ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text('dash.submitProof'.tr()),
            ),
          ],
        ),
      ),
    );
  }
}
