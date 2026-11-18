import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../models/agent.dart';
import '../../repositories/agent_dashboard_repository.dart';
import '../agents/agent_detail_screen.dart' show socialNetworks;

/// Edit the public profile: the same fields as the website's profile page,
/// including WhatsApp and social links (shown as buttons on the profile,
/// with every press counted) and, for corporate agencies, the company details.
class AgentProfileScreen extends ConsumerStatefulWidget {
  const AgentProfileScreen({super.key});

  @override
  ConsumerState<AgentProfileScreen> createState() => _AgentProfileScreenState();
}

class _AgentProfileScreenState extends ConsumerState<AgentProfileScreen> {
  late final Agent? _agent = ref.read(authControllerProvider).agent;

  late final _name = TextEditingController(text: _agent?.name);
  late final _title = TextEditingController(text: _agent?.title);
  late final _location = TextEditingController(text: _agent?.location);
  late final _bio = TextEditingController(text: _agent?.bio);
  late final _phone = TextEditingController(text: _agent?.phone);
  late final _whatsapp = TextEditingController(text: _agent?.whatsapp);
  late final _office = TextEditingController(text: _agent?.officeAddress);
  late final _socials = {
    for (final (key, _) in socialNetworks) key: TextEditingController(text: _agent?.socialLinks[key]),
  };
  // Corporate agencies only.
  late final _businessType = TextEditingController(text: _agent?.agencyBusinessType);
  late final _agencyEmail = TextEditingController(text: _agent?.agencyEmail);
  late final _website = TextEditingController(text: _agent?.agencyWebsite);
  late final _agencyAbout = TextEditingController(text: _agent?.agencyAbout);
  late final _services = TextEditingController(text: _agent?.agencyServices.join(', '));
  late final _areas = TextEditingController(text: _agent?.agencyAreasServed.join(', '));

  bool _saving = false;

  List<TextEditingController> get _all => [
        _name, _title, _location, _bio, _phone, _whatsapp, _office, ..._socials.values,
        _businessType, _agencyEmail, _website, _agencyAbout, _services, _areas,
      ];

  @override
  void dispose() {
    for (final c in _all) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    FocusScope.of(context).unfocus();
    setState(() => _saving = true);
    final corporate = _agent?.isCorporate ?? false;
    try {
      final updated = await ref.read(agentDashboardRepositoryProvider).updateProfile({
        'name': _name.text.trim(),
        'title': _title.text.trim(),
        'location': _location.text.trim(),
        'bio': _bio.text.trim(),
        'phone': _phone.text.trim(),
        'whatsapp': _whatsapp.text.trim(),
        'officeAddress': _office.text.trim(),
        'socialLinks': {for (final e in _socials.entries) e.key: e.value.text.trim()},
        if (corporate) ...{
          'agencyBusinessType': _businessType.text.trim(),
          'agencyEmail': _agencyEmail.text.trim(),
          'agencyWebsite': _website.text.trim(),
          'agencyAbout': _agencyAbout.text.trim(),
          'agencyServices': _services.text,
          'agencyAreasServed': _areas.text,
        },
      });
      ref.read(authControllerProvider.notifier).updateAgent(updated);
      // Links come back cleaned (handles become full addresses): show them.
      for (final e in _socials.entries) {
        e.value.text = updated.socialLinks[e.key] ?? '';
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('agentProfile.saved'.tr())));
      }
    } catch (e) {
      if (mounted) {
        final message = e.asApiException?.message ?? 'common.somethingWentWrong'.tr();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final agent = _agent;
    final corporate = agent?.isCorporate ?? false;

    return Scaffold(
      appBar: AppBar(
        title: Text('dashboard.profile'.tr()),
        actions: [
          if (agent != null)
            TextButton(
              onPressed: () => context.push('/agent/${agent.id}'),
              child: Text('agentProfile.viewPublic'.tr()),
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
        children: [
          _field(_name, 'auth.fullName'.tr(), autofill: const [AutofillHints.name]),
          _field(_title, 'profileForm.title'.tr()),
          _field(_location, 'profileForm.location'.tr()),
          _field(_phone, 'profileForm.phone'.tr(), keyboard: TextInputType.phone, icon: Icons.call_outlined),
          _field(_bio, 'profileForm.bio'.tr(), lines: 4),

          _heading('agentProfile.contactSection'.tr(), 'agentProfile.contactSectionHint'.tr()),
          _field(_whatsapp, 'agentProfile.whatsappField'.tr(),
              keyboard: TextInputType.phone, icon: Icons.chat_outlined, hint: '+258 84 123 4567'),
          for (final (key, label) in socialNetworks)
            _field(
              _socials[key]!,
              label,
              keyboard: TextInputType.url,
              leading: Padding(
                padding: const EdgeInsets.all(13),
                child: SvgPicture.asset('assets/social/$key.svg', width: 20, height: 20),
              ),
              hint: key == 'linkedin' ? 'linkedin.com/in/…' : '@…',
            ),
          _field(_office, 'agentProfile.officeField'.tr(), icon: Icons.location_on_outlined, lines: 2),

          if (corporate) ...[
            _heading('agentProfile.companySection'.tr(), null),
            _field(_businessType, 'agentProfile.businessType'.tr()),
            _field(_agencyEmail, 'agentProfile.publicEmail'.tr(), keyboard: TextInputType.emailAddress, icon: Icons.mail_outline),
            _field(_website, 'agentProfile.websiteField'.tr(), keyboard: TextInputType.url, icon: Icons.language),
            _field(_agencyAbout, 'agentProfile.aboutField'.tr(), lines: 4),
            _field(_services, 'agentProfile.servicesField'.tr(), lines: 2),
            _field(_areas, 'agentProfile.areasField'.tr(), lines: 2),
          ],

          const SizedBox(height: 8),
          SizedBox(
            height: 52,
            child: ElevatedButton(
              onPressed: _saving ? null : _save,
              child: _saving
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text('common.save'.tr()),
            ),
          ),
        ],
      ),
    );
  }

  Widget _heading(String title, String? hint) => Padding(
        padding: const EdgeInsets.only(top: 16, bottom: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
            if (hint != null) ...[
              const SizedBox(height: 4),
              Text(hint, style: const TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant, height: 1.35)),
            ],
          ],
        ),
      );

  Widget _field(
    TextEditingController controller,
    String label, {
    TextInputType? keyboard,
    IconData? icon,
    Widget? leading,
    String? hint,
    int lines = 1,
    List<String>? autofill,
  }) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: TextField(
          controller: controller,
          keyboardType: lines > 1 ? TextInputType.multiline : keyboard,
          maxLines: lines,
          autocorrect: keyboard != TextInputType.url && keyboard != TextInputType.emailAddress,
          autofillHints: autofill,
          decoration: InputDecoration(
            labelText: label,
            hintText: hint,
            prefixIcon: leading ?? (icon != null ? Icon(icon) : null),
          ),
        ),
      );
}
