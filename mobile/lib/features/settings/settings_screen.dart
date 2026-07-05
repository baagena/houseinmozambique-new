import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

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
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: Text('settings.about'.tr()),
            subtitle: const Text('House in Mozambique · v1.0.0'),
          ),
        ],
      ),
    );
  }
}
