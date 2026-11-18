import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../repositories/inquiry_repository.dart';
import '../../services/firebase_services.dart';
import '../../widgets/sheets.dart';
import '../../controllers/auth_controller.dart';

class ContactScreen extends ConsumerStatefulWidget {
  final String? propertyId;
  final String? agentId;
  final String? prefillSubject;

  const ContactScreen({super.key, this.propertyId, this.agentId, this.prefillSubject});

  @override
  ConsumerState<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends ConsumerState<ContactScreen> {
  final _formKey = GlobalKey<FormState>();
  late final _nameController = TextEditingController(text: ref.read(authControllerProvider).agent?.name ?? '');
  late final _emailController = TextEditingController(text: ref.read(authControllerProvider).agent?.email ?? '');
  late final _subjectController = TextEditingController(text: widget.prefillSubject ?? '');
  late final _messageController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    try {
      await ref.read(inquiryRepositoryProvider).submit(
            name: _nameController.text.trim(),
            email: _emailController.text.trim(),
            subject: _subjectController.text.trim(),
            message: _messageController.text.trim(),
            propertyId: widget.propertyId,
            agentId: widget.agentId,
          );
      Analytics.contactAgent('form');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('contact.success'.tr())));
      _close();
    } catch (e) {
      if (!mounted) return;
      final message = e.asApiException?.message ?? 'contact.error'.tr();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _close() {
    // This sheet can be the only route on the stack (e.g. after a login
    // redirect); popping then would leave a black screen behind.
    final router = GoRouter.of(context);
    if (router.canPop()) {
      router.pop();
    } else {
      router.go('/home');
    }
  }

  String? _required(String? v) => (v == null || v.trim().isEmpty) ? 'common.required'.tr() : null;

  @override
  Widget build(BuildContext context) {
    return RouteSheet(
      onClose: _close,
      builder: (context, scrollController) => Form(
        key: _formKey,
        child: ListView(
          controller: scrollController,
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          children: [
            SheetTitle('contact.title'.tr(), onClose: _close),
            TextFormField(
              controller: _nameController,
              textInputAction: TextInputAction.next,
              textCapitalization: TextCapitalization.words,
              decoration: InputDecoration(labelText: 'contact.name'.tr()),
              validator: _required,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              autocorrect: false,
              decoration: InputDecoration(labelText: 'contact.email'.tr()),
              validator: (v) => RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch((v ?? '').trim())
                  ? null
                  : 'admin.validEmail'.tr(),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _subjectController,
              textInputAction: TextInputAction.next,
              textCapitalization: TextCapitalization.sentences,
              decoration: InputDecoration(labelText: 'contact.subject'.tr()),
              validator: _required,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _messageController,
              maxLines: 5,
              textCapitalization: TextCapitalization.sentences,
              decoration: InputDecoration(labelText: 'contact.message'.tr(), alignLabelWithHint: true),
              validator: _required,
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submitting ? null : _submit,
                child: _submitting
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text('common.send'.tr()),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
