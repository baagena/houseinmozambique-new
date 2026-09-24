import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../core/utils/legal_links.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final currentLocale = context.locale.languageCode;

    return Scaffold(
      appBar: AppBar(title: Text('settings.title'.tr())),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('settings.language'.tr(), style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          ListTile(
            title: Text('settings.english'.tr()),
            trailing: currentLocale == 'en' ? const Icon(Icons.check_circle) : const Icon(Icons.circle_outlined),
            onTap: () => context.setLocale(const Locale('en')),
          ),
          ListTile(
            title: Text('settings.portuguese'.tr()),
            trailing: currentLocale == 'pt' ? const Icon(Icons.check_circle) : const Icon(Icons.circle_outlined),
            onTap: () => context.setLocale(const Locale('pt')),
          ),
          const Divider(height: 32),
          Text('settings.legal'.tr(), style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          ListTile(
            leading: const Icon(Icons.description_outlined),
            title: Text('settings.termsOfService'.tr()),
            trailing: const Icon(Icons.open_in_new, size: 18),
            onTap: openTermsOfService,
          ),
          ListTile(
            leading: const Icon(Icons.privacy_tip_outlined),
            title: Text('settings.privacyPolicy'.tr()),
            trailing: const Icon(Icons.open_in_new, size: 18),
            onTap: openPrivacyPolicy,
          ),
          const Divider(height: 32),
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: Text('settings.about'.tr()),
            subtitle: const Text('House in Mozambique · v1.2.1'),
          ),
        ],
      ),
    );
  }
}
