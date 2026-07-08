import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../controllers/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';

const _lastEmailKey = 'last_login_email';

class LoginScreen extends ConsumerStatefulWidget {
  final String? redirectTo;
  const LoginScreen({super.key, this.redirectTo});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _passwordFocus = FocusNode();
  bool _submitting = false;
  bool _obscurePassword = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _prefillLastEmail();
  }

  /// Returning users shouldn't retype their email every time: prefill the
  /// last one used and jump straight to the password field.
  Future<void> _prefillLastEmail() async {
    final prefs = await SharedPreferences.getInstance();
    final lastEmail = prefs.getString(_lastEmailKey);
    if (lastEmail != null && mounted && _emailController.text.isEmpty) {
      _emailController.text = lastEmail;
      _passwordFocus.requestFocus();
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final email = _emailController.text.trim();
      await ref.read(authControllerProvider.notifier).login(email, _passwordController.text);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_lastEmailKey, email);
      // Let Android/iOS offer to save the credentials for autofill next time.
      TextInput.finishAutofillContext();
      if (mounted) {
        // Land on a real tab first so sheet-style redirect targets (e.g. the
        // post-a-house form) keep a page underneath instead of a black screen.
        context.go('/profile');
        if (widget.redirectTo != null) context.push(widget.redirectTo!);
      }
    } catch (e) {
      setState(() => _error = e.asApiException?.message ?? 'common.somethingWentWrong'.tr());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('auth.loginTitle'.tr())),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: AutofillGroup(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('auth.loginSubtitle'.tr(), style: const TextStyle(fontSize: 13.5, color: AppColors.onSurfaceVariant)),
                const SizedBox(height: 20),
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                  ),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  autofillHints: const [AutofillHints.username, AutofillHints.email],
                  textInputAction: TextInputAction.next,
                  onFieldSubmitted: (_) => _passwordFocus.requestFocus(),
                  decoration: InputDecoration(labelText: 'auth.email'.tr(), prefixIcon: const Icon(Icons.email_outlined)),
                  validator: (v) => (v == null || !v.contains('@')) ? 'auth.emailInvalid'.tr() : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _passwordController,
                  focusNode: _passwordFocus,
                  obscureText: _obscurePassword,
                  autofillHints: const [AutofillHints.password],
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submitting ? null : _submit(),
                  decoration: InputDecoration(
                    labelText: 'auth.password'.tr(),
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(_obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                  validator: (v) => (v == null || v.isEmpty) ? 'auth.passwordRequired'.tr() : null,
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  child: _submitting
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text('auth.login'.tr()),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => context.push('/agent-register', extra: widget.redirectTo),
                  child: Text('${'auth.noAccount'.tr()} ${'auth.signUp'.tr()}'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
