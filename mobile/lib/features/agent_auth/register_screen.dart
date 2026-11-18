import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/legal_links.dart';

/// The four kinds of account, as on the website. CORPORATE is an agent
/// account with a company attached; staff review it before it is listed.
enum AccountKind { customer, owner, agent, corporate }

extension on AccountKind {
  String get apiValue => switch (this) {
        AccountKind.customer => 'CUSTOMER',
        AccountKind.owner => 'OWNER',
        AccountKind.agent => 'AGENT',
        AccountKind.corporate => 'CORPORATE',
      };
}

AccountKind _kindFrom(String value) => switch (value.toUpperCase()) {
      'CUSTOMER' => AccountKind.customer,
      'OWNER' => AccountKind.owner,
      'CORPORATE' => AccountKind.corporate,
      _ => AccountKind.agent,
    };

enum _Step { type, account, professional, profile, company, services }

/// Sign-up: first "what describes you?", then only the steps that kind of
/// account needs.
class RegisterScreen extends ConsumerStatefulWidget {
  final String? redirectTo;
  final String initialAccountType;
  const RegisterScreen({
    super.key,
    this.redirectTo,
    this.initialAccountType = 'AGENT',
  });

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _pageController = PageController();
  final _formKeys = {for (final s in _Step.values) s: GlobalKey<FormState>()};

  // Account
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  final _city = TextEditingController();
  // Agent
  final _title = TextEditingController();
  final _years = TextEditingController();
  final _bio = TextEditingController();
  final _specInput = TextEditingController();
  final List<String> _specializations = [];
  // Company
  final _agencyName = TextEditingController();
  final _businessType = TextEditingController();
  final _agencyPhone = TextEditingController();
  final _agencyEmail = TextEditingController();
  final _website = TextEditingController();
  final _areas = TextEditingController();
  final _about = TextEditingController();
  final _serviceInput = TextEditingController();
  final Set<String> _services = {};
  final List<String> _customServices = [];

  late AccountKind _kind = _kindFrom(widget.initialAccountType);
  int _index = 0;
  bool _acceptedTerms = false;
  bool _submitting = false;
  bool _showPassword = false;
  String? _error;

  List<_Step> get _steps => switch (_kind) {
        AccountKind.customer || AccountKind.owner => const [_Step.type, _Step.account],
        AccountKind.agent => const [_Step.type, _Step.account, _Step.professional, _Step.profile],
        AccountKind.corporate => const [_Step.type, _Step.account, _Step.company, _Step.services],
      };
  _Step get _current => _steps[_index];
  bool get _onLastStep => _index == _steps.length - 1;

  @override
  void dispose() {
    _pageController.dispose();
    for (final c in [
      _name, _email, _phone, _password, _confirm, _city, _title, _years, _bio, _specInput,
      _agencyName, _businessType, _agencyPhone, _agencyEmail, _website, _areas, _about, _serviceInput,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  void _goTo(int index) {
    FocusScope.of(context).unfocus();
    setState(() => _index = index);
    _pageController.animateToPage(index, duration: const Duration(milliseconds: 280), curve: Curves.easeOutCubic);
  }

  Future<void> _next() async {
    if (!(_formKeys[_current]!.currentState?.validate() ?? true)) return;
    if (_onLastStep) {
      if (!_acceptedTerms) {
        setState(() => _error = 'auth.mustAcceptTerms'.tr());
        return;
      }
      await _submit();
    } else {
      setState(() => _error = null);
      _goTo(_index + 1);
    }
  }

  void _back() {
    if (_index == 0) return;
    setState(() => _error = null);
    _goTo(_index - 1);
  }

  void _addItem(TextEditingController input, List<String> into) {
    final value = input.text.trim();
    if (value.isEmpty || into.contains(value)) return;
    setState(() {
      into.add(value);
      input.clear();
    });
  }

  String? _opt(TextEditingController c) => c.text.trim().isEmpty ? null : c.text.trim();

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _error = null;
    });
    final agent = _kind == AccountKind.agent;
    final corporate = _kind == AccountKind.corporate;
    try {
      await ref.read(authControllerProvider.notifier).register(
            email: _email.text.trim().toLowerCase(),
            password: _password.text,
            name: _name.text.trim(),
            role: _kind.apiValue,
            acceptedTerms: _acceptedTerms,
            phone: corporate ? null : _opt(_phone),
            title: agent ? _opt(_title) : null,
            location: agent ? _opt(_city) : (_kind == AccountKind.owner ? _opt(_city) : null),
            yearsExperience: agent ? int.tryParse(_years.text.trim()) : null,
            bio: agent ? _opt(_bio) : null,
            specializations: agent && _specializations.isNotEmpty ? _specializations : null,
            extra: corporate
                ? {
                    'accountType': 'CORPORATE',
                    'agencyName': _agencyName.text.trim(),
                    'agencyPhone': _agencyPhone.text.trim(),
                    if (_opt(_businessType) != null) 'agencyBusinessType': _opt(_businessType),
                    if (_opt(_agencyEmail) != null) 'agencyEmail': _opt(_agencyEmail),
                    if (_opt(_website) != null) 'agencyWebsite': _opt(_website),
                    if (_opt(_about) != null) 'agencyAbout': _opt(_about),
                    'agencyServices': [..._services, ..._customServices],
                    'agencyAreasServed': _areas.text,
                    if (_opt(_city) != null) 'location': _opt(_city),
                  }
                : null,
          );
      if (!mounted) return;
      final note = switch (_kind) {
        AccountKind.corporate => 'register.corporateDone'.tr(),
        AccountKind.agent || AccountKind.owner => 'register.checkEmail'.tr(),
        AccountKind.customer => null,
      };
      final messenger = ScaffoldMessenger.of(context);
      // Land on a real tab first so sheet-style redirect targets (e.g. the
      // post-a-house form) keep a page underneath instead of a black screen.
      context.go('/profile');
      if (widget.redirectTo != null) context.push(widget.redirectTo!);
      if (note != null) messenger.showSnackBar(SnackBar(content: Text(note), duration: const Duration(seconds: 6)));
    } catch (e) {
      setState(() => _error = e.asApiException?.message ?? 'common.somethingWentWrong'.tr());
      // Most refusals are about the email or password: show that step.
      _goTo(1);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  // ── Build ──────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final keyboardOpen = MediaQuery.viewInsetsOf(context).bottom > 0;
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        leading: IconButton(
          tooltip: 'common.close'.tr(),
          onPressed: _submitting
              ? null
              : () => context.canPop() ? context.pop() : context.go('/profile'),
          icon: const Icon(Icons.close),
        ),
        title: Text('register.title'.tr()),
      ),
      body: Column(
        children: [
          _Progress(labels: [for (final s in _steps) _label(s)], index: _index),
          if (_error != null)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.fromLTRB(20, 8, 20, 0),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: AppColors.errorContainer, borderRadius: BorderRadius.circular(12)),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: AppColors.onErrorContainer, size: 20),
                  const SizedBox(width: 8),
                  Expanded(child: Text(_error!, style: const TextStyle(color: AppColors.onErrorContainer))),
                ],
              ),
            ),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: [for (final s in _steps) _page(s)],
            ),
          ),
          if (_onLastStep)
            _TermsCheckbox(
              value: _acceptedTerms,
              onChanged: (v) => setState(() {
                _acceptedTerms = v;
                if (v && _error == 'auth.mustAcceptTerms'.tr()) _error = null;
              }),
            ),
          Padding(
            padding: EdgeInsets.fromLTRB(20, _onLastStep ? 8 : 16, 20, 12),
            child: Row(
              children: [
                if (_index > 0) ...[
                  Expanded(
                    child: SizedBox(
                      height: 52,
                      child: OutlinedButton(
                        onPressed: _submitting ? null : _back,
                        child: Text('common.back'.tr()),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  flex: 2,
                  child: SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _submitting || (_onLastStep && !_acceptedTerms) ? null : _next,
                      child: _submitting
                          ? const SizedBox(
                              width: 20, height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : Text(_onLastStep ? _submitLabel() : 'common.continue'.tr()),
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (!keyboardOpen)
            TextButton(
              onPressed: () => context.push('/agent-login', extra: widget.redirectTo),
              child: Text('${'auth.haveAccount'.tr()} ${'auth.signIn'.tr()}'),
            ),
          SizedBox(height: keyboardOpen ? 4 : 8),
        ],
      ),
    );
  }

  String _label(_Step s) => switch (s) {
        _Step.type => 'register.stepType'.tr(),
        _Step.account => 'register.stepAccount'.tr(),
        _Step.professional => 'register.stepProfessional'.tr(),
        _Step.profile => 'register.stepProfile'.tr(),
        _Step.company => 'register.stepCompany'.tr(),
        _Step.services => 'register.stepServices'.tr(),
      };

  String _submitLabel() => switch (_kind) {
        AccountKind.customer => 'register.submitCustomer'.tr(),
        AccountKind.owner => 'register.submitOwner'.tr(),
        AccountKind.agent => 'register.submitAgent'.tr(),
        AccountKind.corporate => 'register.submitCorporate'.tr(),
      };

  Widget _page(_Step s) => switch (s) {
        _Step.type => _typePage(),
        _Step.account => _accountPage(),
        _Step.professional => _professionalPage(),
        _Step.profile => _profilePage(),
        _Step.company => _companyPage(),
        _Step.services => _servicesPage(),
      };

  Widget _typePage() => _StepPage(
        formKey: _formKeys[_Step.type]!,
        title: 'register.chooseHeading'.tr(),
        subtitle: 'register.chooseSubtitle'.tr(),
        children: [
          for (final (kind, icon, title, desc) in [
            (AccountKind.customer, Icons.search, 'register.typeCustomer', 'register.typeCustomerDesc'),
            (AccountKind.owner, Icons.house_outlined, 'register.typeOwner', 'register.typeOwnerDesc'),
            (AccountKind.agent, Icons.badge_outlined, 'register.typeAgent', 'register.typeAgentDesc'),
            (AccountKind.corporate, Icons.apartment, 'register.typeCorporate', 'register.typeCorporateDesc'),
          ])
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _TypeCard(
                icon: icon,
                title: title.tr(),
                description: desc.tr(),
                badge: kind == AccountKind.corporate ? 'register.reviewed'.tr() : null,
                selected: _kind == kind,
                onTap: () => setState(() {
                  _kind = kind;
                  _error = null;
                }),
              ),
            ),
        ],
      );

  Widget _accountPage() {
    final corporate = _kind == AccountKind.corporate;
    return _StepPage(
      formKey: _formKeys[_Step.account]!,
      title: corporate
          ? 'register.representativeHeading'.tr()
          : (_kind == AccountKind.customer ? 'auth.customerHeading'.tr() : 'register.accountHeading'.tr()),
      subtitle: switch (_kind) {
        AccountKind.corporate => 'register.representativeSubtitle'.tr(),
        AccountKind.owner => 'register.ownerSubtitle'.tr(),
        AccountKind.customer => 'auth.customerSubtitle'.tr(),
        AccountKind.agent => 'register.accountSubtitle'.tr(),
      },
      children: [
        _Field(
          controller: _name,
          label: corporate ? 'register.representativeName'.tr() : 'auth.fullName'.tr(),
          icon: Icons.person_outline,
          autofill: const [AutofillHints.name],
          validator: (v) => (v == null || v.trim().isEmpty) ? 'auth.nameRequired'.tr() : null,
        ),
        _Field(
          controller: _email,
          label: 'auth.email'.tr(),
          icon: Icons.email_outlined,
          keyboard: TextInputType.emailAddress,
          autofill: const [AutofillHints.email],
          plain: true,
          validator: (v) {
            final t = v?.trim() ?? '';
            return RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(t) ? null : 'auth.emailInvalid'.tr();
          },
        ),
        if (!corporate)
          _Field(
            controller: _phone,
            label: 'auth.phone'.tr(),
            icon: Icons.phone_outlined,
            keyboard: TextInputType.phone,
            hint: '+258 84 123 4567',
            autofill: const [AutofillHints.telephoneNumber],
          ),
        if (_kind == AccountKind.owner)
          _Field(controller: _city, label: 'register.city'.tr(), icon: Icons.location_on_outlined, hint: 'register.cityHint'.tr()),
        _Field(
          controller: _password,
          label: 'auth.password'.tr(),
          icon: Icons.lock_outline,
          obscure: !_showPassword,
          plain: true,
          autofill: const [AutofillHints.newPassword],
          suffix: IconButton(
            tooltip: _showPassword ? 'common.hide'.tr() : 'common.show'.tr(),
            icon: Icon(_showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
            onPressed: () => setState(() => _showPassword = !_showPassword),
          ),
          validator: (v) => (v == null || v.length < 8) ? 'auth.passwordTooShort'.tr() : null,
        ),
        _Field(
          controller: _confirm,
          label: 'auth.confirmPassword'.tr(),
          icon: Icons.lock_outline,
          obscure: !_showPassword,
          plain: true,
          validator: (v) => v != _password.text ? 'auth.passwordsDontMatch'.tr() : null,
        ),
      ],
    );
  }

  Widget _professionalPage() => _StepPage(
        formKey: _formKeys[_Step.professional]!,
        title: 'auth.professionalProfile'.tr(),
        subtitle: 'auth.professionalProfileSubtitle'.tr(),
        children: [
          _Field(controller: _title, label: 'auth.professionalTitle'.tr(), hint: 'auth.professionalTitleHint'.tr(), icon: Icons.badge_outlined),
          _Field(controller: _years, label: 'auth.yearsExperience'.tr(), icon: Icons.timeline_outlined, keyboard: TextInputType.number),
          _Field(controller: _city, label: 'auth.officeLocation'.tr(), icon: Icons.location_on_outlined),
        ],
      );

  Widget _profilePage() => _StepPage(
        formKey: _formKeys[_Step.profile]!,
        title: 'auth.showcaseExpertise'.tr(),
        subtitle: 'auth.showcaseSubtitle'.tr(),
        children: [
          _Field(controller: _bio, label: 'auth.bio'.tr(), hint: 'auth.bioHint'.tr(), lines: 4),
          if (_specializations.isNotEmpty) ...[
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final s in _specializations)
                  InputChip(label: Text(s), onDeleted: () => setState(() => _specializations.remove(s))),
              ],
            ),
            const SizedBox(height: 12),
          ],
          _AddRow(
            controller: _specInput,
            label: 'auth.specializations'.tr(),
            hint: 'auth.specializationsHint'.tr(),
            onAdd: () => _addItem(_specInput, _specializations),
          ),
        ],
      );

  Widget _companyPage() => _StepPage(
        formKey: _formKeys[_Step.company]!,
        title: 'register.companyHeading'.tr(),
        subtitle: 'register.companySubtitle'.tr(),
        children: [
          _Field(
            controller: _agencyName,
            label: 'register.agencyName'.tr(),
            icon: Icons.apartment,
            validator: (v) => (v == null || v.trim().isEmpty) ? 'register.agencyNameRequired'.tr() : null,
          ),
          _Field(controller: _businessType, label: 'register.businessType'.tr(), hint: 'register.businessTypeHint'.tr(), icon: Icons.work_outline),
          _Field(
            controller: _agencyPhone,
            label: 'register.agencyPhone'.tr(),
            icon: Icons.phone_outlined,
            keyboard: TextInputType.phone,
            hint: '+258 84 123 4567',
            validator: (v) {
              final digits = (v ?? '').replaceAll(RegExp(r'\D'), '');
              return digits.length < 6 || digits.length > 20 ? 'register.agencyPhoneRequired'.tr() : null;
            },
          ),
          _Field(controller: _city, label: 'register.city'.tr(), icon: Icons.location_on_outlined, hint: 'register.cityHint'.tr()),
          _Field(controller: _agencyEmail, label: 'register.agencyEmail'.tr(), icon: Icons.alternate_email, keyboard: TextInputType.emailAddress, plain: true),
          _Field(
            controller: _website,
            label: 'register.website'.tr(),
            icon: Icons.language,
            keyboard: TextInputType.url,
            hint: 'https://',
            plain: true,
            validator: (v) {
              final t = v?.trim() ?? '';
              return t.isEmpty || t.toLowerCase().startsWith('https://') ? null : 'register.websiteInvalid'.tr();
            },
          ),
        ],
      );

  Widget _servicesPage() {
    final presets = [for (var i = 1; i <= 8; i++) 'register.service$i'.tr()];
    return _StepPage(
      formKey: _formKeys[_Step.services]!,
      title: 'register.servicesHeading'.tr(),
      subtitle: 'register.servicesSubtitle'.tr(),
      children: [
        Text('register.servicesLabel'.tr(), style: const TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final p in presets)
              FilterChip(
                label: Text(p),
                selected: _services.contains(p),
                onSelected: (on) => setState(() => on ? _services.add(p) : _services.remove(p)),
              ),
            for (final c in _customServices)
              InputChip(label: Text(c), selected: true, onDeleted: () => setState(() => _customServices.remove(c))),
          ],
        ),
        const SizedBox(height: 12),
        _AddRow(
          controller: _serviceInput,
          label: 'register.customService'.tr(),
          onAdd: () => _addItem(_serviceInput, _customServices),
        ),
        const SizedBox(height: 16),
        _Field(controller: _areas, label: 'register.areas'.tr(), hint: 'register.areasHint'.tr(), icon: Icons.map_outlined),
        _Field(controller: _about, label: 'register.about'.tr(), hint: 'register.aboutHint'.tr(), lines: 4),
      ],
    );
  }
}

// ── Pieces ────────────────────────────────────────────────────────────────

class _Progress extends StatelessWidget {
  final List<String> labels;
  final int index;
  const _Progress({required this.labels, required this.index});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 4),
      child: Row(
        children: [
          for (var i = 0; i < labels.length; i++)
            Expanded(
              child: Padding(
                padding: EdgeInsets.only(right: i == labels.length - 1 ? 0 : 6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      height: 4,
                      decoration: BoxDecoration(
                        color: i <= index ? AppColors.primary : AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      labels[i],
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: i == index ? FontWeight.w700 : FontWeight.w500,
                        color: i <= index ? AppColors.primary : AppColors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _StepPage extends StatelessWidget {
  final GlobalKey<FormState> formKey;
  final String title;
  final String subtitle;
  final List<Widget> children;
  const _StepPage({required this.formKey, required this.title, required this.subtitle, required this.children});

  @override
  Widget build(BuildContext context) => SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
        child: Form(
          key: formKey,
          child: AutofillGroup(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(subtitle, style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 14, height: 1.35)),
                const SizedBox(height: 20),
                ...children,
              ],
            ),
          ),
        ),
      );
}

class _TypeCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final String? badge;
  final bool selected;
  final VoidCallback onTap;
  const _TypeCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.selected,
    required this.onTap,
    this.badge,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      selected: selected,
      button: true,
      child: Material(
        color: selected ? AppColors.primary.withValues(alpha: 0.05) : AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: selected ? AppColors.primary : AppColors.surfaceContainerHigh,
                width: selected ? 2 : 1,
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: selected ? AppColors.primary : AppColors.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: selected ? Colors.white : AppColors.primary),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Wraps: on narrow phones with large text the badge drops below.
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(title, style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700)),
                          if (badge != null) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.secondary.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(badge!,
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.secondary)),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(description, style: const TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant, height: 1.3)),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 180),
                  child: Icon(
                    selected ? Icons.check_circle : Icons.radio_button_unchecked,
                    key: ValueKey(selected),
                    color: selected ? AppColors.primary : AppColors.outlineVariant,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String? hint;
  final IconData? icon;
  final TextInputType? keyboard;
  final bool obscure;
  final bool plain;
  final int lines;
  final Widget? suffix;
  final List<String>? autofill;
  final String? Function(String?)? validator;
  const _Field({
    required this.controller,
    required this.label,
    this.hint,
    this.icon,
    this.keyboard,
    this.obscure = false,
    this.plain = false,
    this.lines = 1,
    this.suffix,
    this.autofill,
    this.validator,
  });

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: TextFormField(
          controller: controller,
          obscureText: obscure,
          keyboardType: lines > 1 ? TextInputType.multiline : keyboard,
          maxLines: obscure ? 1 : lines,
          // Emails, passwords and links: no capitals or "corrections".
          autocorrect: !plain,
          enableSuggestions: !plain,
          textCapitalization: plain ? TextCapitalization.none : TextCapitalization.sentences,
          autofillHints: autofill,
          validator: validator,
          decoration: InputDecoration(
            labelText: label,
            hintText: hint,
            alignLabelWithHint: lines > 1,
            prefixIcon: icon == null ? null : Icon(icon),
            suffixIcon: suffix,
          ),
        ),
      );
}

class _AddRow extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String? hint;
  final VoidCallback onAdd;
  const _AddRow({required this.controller, required this.label, required this.onAdd, this.hint});

  @override
  Widget build(BuildContext context) => Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              textCapitalization: TextCapitalization.sentences,
              decoration: InputDecoration(labelText: label, hintText: hint),
              onSubmitted: (_) => onAdd(),
            ),
          ),
          const SizedBox(width: 8),
          IconButton.filled(
            tooltip: label,
            onPressed: onAdd,
            icon: const Icon(Icons.add),
          ),
        ],
      );
}

class _TermsCheckbox extends StatelessWidget {
  final bool value;
  final ValueChanged<bool> onChanged;
  const _TermsCheckbox({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    const linkStyle = TextStyle(
      color: AppColors.primary,
      fontWeight: FontWeight.w700,
      decoration: TextDecoration.underline,
      fontSize: 13,
    );
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 20, 0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Checkbox(value: value, onChanged: (v) => onChanged(v ?? false)),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Wrap(
                children: [
                  GestureDetector(
                    onTap: () => onChanged(!value),
                    child: Text('${'auth.agreePrefix'.tr()} ', style: const TextStyle(fontSize: 13)),
                  ),
                  GestureDetector(onTap: openTermsOfService, child: Text('auth.terms'.tr(), style: linkStyle)),
                  Text(' ${'auth.and'.tr()} ', style: const TextStyle(fontSize: 13)),
                  GestureDetector(onTap: openPrivacyPolicy, child: Text('auth.privacy'.tr(), style: linkStyle)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
