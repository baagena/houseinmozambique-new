import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';

const _agentSteps = ['Personal', 'Professional', 'Expertise'];
const _customerSteps = ['Personal'];

class RegisterScreen extends ConsumerStatefulWidget {
  final String? redirectTo;
  final String initialAccountType;
  const RegisterScreen({super.key, this.redirectTo, this.initialAccountType = 'AGENT'});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _pageController = PageController();
  final _formKeys = List.generate(3, (_) => GlobalKey<FormState>());

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _titleController = TextEditingController();
  final _locationController = TextEditingController();
  final _yearsController = TextEditingController();
  final _bioController = TextEditingController();
  final _specInputController = TextEditingController();
  final List<String> _specializations = [];

  late String _accountType = widget.initialAccountType;
  int _step = 0;
  bool _submitting = false;
  String? _error;

  List<String> get _steps => _accountType == 'CUSTOMER' ? _customerSteps : _agentSteps;
  bool get _isCustomer => _accountType == 'CUSTOMER';

  void _setAccountType(String type) {
    if (_accountType == type) return;
    setState(() {
      _accountType = type;
      _step = 0;
    });
    _pageController.jumpToPage(0);
  }

  @override
  void dispose() {
    _pageController.dispose();
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _titleController.dispose();
    _locationController.dispose();
    _yearsController.dispose();
    _bioController.dispose();
    _specInputController.dispose();
    super.dispose();
  }

  void _addSpecialization() {
    final value = _specInputController.text.trim();
    if (value.isNotEmpty && !_specializations.contains(value)) {
      setState(() {
        _specializations.add(value);
        _specInputController.clear();
      });
    }
  }

  Future<void> _goNext() async {
    if (!_formKeys[_step].currentState!.validate()) return;
    if (_step < _steps.length - 1) {
      setState(() => _step++);
      _pageController.animateToPage(_step, duration: const Duration(milliseconds: 300), curve: Curves.easeOutCubic);
    } else {
      await _submit();
    }
  }

  void _goBack() {
    if (_step == 0) return;
    setState(() => _step--);
    _pageController.animateToPage(_step, duration: const Duration(milliseconds: 300), curve: Curves.easeOutCubic);
  }

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await ref.read(authControllerProvider.notifier).register(
            email: _emailController.text.trim(),
            password: _passwordController.text,
            name: _nameController.text.trim(),
            role: _accountType,
            phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
            title: _isCustomer || _titleController.text.trim().isEmpty ? null : _titleController.text.trim(),
            location: _isCustomer || _locationController.text.trim().isEmpty ? null : _locationController.text.trim(),
            yearsExperience: _isCustomer ? null : int.tryParse(_yearsController.text.trim()),
            bio: _isCustomer || _bioController.text.trim().isEmpty ? null : _bioController.text.trim(),
            specializations: _isCustomer || _specializations.isEmpty ? null : _specializations,
          );
      if (mounted) context.go(widget.redirectTo ?? '/profile');
    } catch (e) {
      setState(() => _error = e.asApiException?.message ?? 'common.somethingWentWrong'.tr());
      // Surface the error near the top of whichever step the user is on.
      setState(() => _step = 0);
      _pageController.jumpToPage(0);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isCustomer ? 'auth.createAccountTitle'.tr() : 'auth.registerTitle'.tr())),
      body: Column(
        children: [
          if (_step == 0)
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 4),
              child: _AccountTypeToggle(accountType: _accountType, onChanged: _setAccountType),
            ),
          if (_steps.length > 1)
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 12, 24, 4),
            child: Row(
              children: List.generate(_steps.length, (i) {
                final active = i <= _step;
                return Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(right: i == _steps.length - 1 ? 0 : 8),
                    child: Column(
                      children: [
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 250),
                          height: 4,
                          decoration: BoxDecoration(
                            color: active ? AppColors.primary : AppColors.surfaceVariant,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          _steps[i],
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: active ? AppColors.primary : AppColors.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 0),
              child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildStep(
                  formKey: _formKeys[0],
                  title: _isCustomer ? 'Create your account' : 'Start your journey',
                  subtitle: _isCustomer
                      ? 'Save favorites and message agents faster across all your devices.'
                      : 'Create your account to join our verified partner network.',
                  children: [
                    TextFormField(
                      controller: _nameController,
                      decoration: InputDecoration(labelText: 'auth.fullName'.tr(), prefixIcon: const Icon(Icons.person_outline)),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'auth.nameRequired'.tr() : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(labelText: 'auth.email'.tr(), prefixIcon: const Icon(Icons.email_outlined)),
                      validator: (v) => (v == null || !v.contains('@')) ? 'auth.emailInvalid'.tr() : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        labelText: 'auth.phone'.tr(),
                        prefixIcon: const Icon(Icons.phone_outlined),
                        hintText: '+258 84 123 4567',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: true,
                      decoration: InputDecoration(labelText: 'auth.password'.tr(), prefixIcon: const Icon(Icons.lock_outline)),
                      validator: (v) => (v == null || v.length < 8) ? 'auth.passwordTooShort'.tr() : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _confirmPasswordController,
                      obscureText: true,
                      decoration: InputDecoration(labelText: 'auth.confirmPassword'.tr(), prefixIcon: const Icon(Icons.lock_outline)),
                      validator: (v) => (v != _passwordController.text) ? 'auth.passwordsDontMatch'.tr() : null,
                    ),
                  ],
                ),
                _buildStep(
                  formKey: _formKeys[1],
                  title: 'Professional profile',
                  subtitle: 'Tell us about your experience and where you operate.',
                  children: [
                    TextFormField(
                      controller: _titleController,
                      decoration: const InputDecoration(
                        labelText: 'Professional title',
                        hintText: 'e.g. Senior Partner',
                        prefixIcon: Icon(Icons.badge_outlined),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _yearsController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Years of experience', prefixIcon: Icon(Icons.timeline_outlined)),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _locationController,
                      decoration: const InputDecoration(labelText: 'Office location / address', prefixIcon: Icon(Icons.location_on_outlined)),
                    ),
                  ],
                ),
                _buildStep(
                  formKey: _formKeys[2],
                  title: 'Showcase your expertise',
                  subtitle: 'Last step to build your presence on the platform.',
                  children: [
                    TextFormField(
                      controller: _bioController,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        labelText: 'Professional bio',
                        hintText: 'Describe your expertise and unique approach…',
                        alignLabelWithHint: true,
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (_specializations.isNotEmpty)
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _specializations
                            .map((s) => AnimatedScale(
                                  scale: 1,
                                  duration: const Duration(milliseconds: 200),
                                  child: Chip(
                                    label: Text(s),
                                    onDeleted: () => setState(() => _specializations.remove(s)),
                                  ),
                                ))
                            .toList(),
                      ),
                    if (_specializations.isNotEmpty) const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _specInputController,
                            decoration: const InputDecoration(labelText: 'Specializations', hintText: 'e.g. Coastal Villas'),
                            onFieldSubmitted: (_) => _addSpecialization(),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton.filled(onPressed: _addSpecialization, icon: const Icon(Icons.add)),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Row(
              children: [
                if (_step > 0)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _submitting ? null : _goBack,
                      child: const Text('Back'),
                    ),
                  ),
                if (_step > 0) const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: _submitting ? null : _goNext,
                    child: _submitting
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text(_step == _steps.length - 1 ? (_isCustomer ? 'Create account' : 'Complete application') : 'Continue'),
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () => context.push('/agent-login', extra: widget.redirectTo),
            child: Text('${'auth.haveAccount'.tr()} ${'auth.signIn'.tr()}'),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildStep({
    required GlobalKey<FormState> formKey,
    required String title,
    required String subtitle,
    required List<Widget> children,
  }) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(subtitle, style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13)),
            const SizedBox(height: 20),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _AccountTypeToggle extends StatelessWidget {
  final String accountType;
  final ValueChanged<String> onChanged;
  const _AccountTypeToggle({required this.accountType, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainer,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Expanded(child: _segment(label: 'Customer', value: 'CUSTOMER')),
          Expanded(child: _segment(label: 'Agent', value: 'AGENT')),
        ],
      ),
    );
  }

  Widget _segment({required String label, required String value}) {
    final selected = accountType == value;
    return GestureDetector(
      onTap: () => onChanged(value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: selected ? Colors.white : AppColors.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}
