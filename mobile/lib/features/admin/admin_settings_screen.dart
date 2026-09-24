import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../controllers/auth_controller.dart';
import '../../core/theme/app_theme.dart';

class AdminSettingsScreen extends ConsumerStatefulWidget {
  const AdminSettingsScreen({super.key});

  @override
  ConsumerState<AdminSettingsScreen> createState() => _AdminSettingsScreenState();
}

class _AdminSettingsScreenState extends ConsumerState<AdminSettingsScreen> {
  bool _globalNotifications = true;
  bool _agentApprovalAlerts = true;
  bool _weeklyReport = false;
  bool _saving = false;

  Future<void> _save() async {
    setState(() => _saving = true);
    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;
    setState(() => _saving = false);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('admin.settingsUpdated'.tr())));
  }

  @override
  Widget build(BuildContext context) {
    final agent = ref.watch(authControllerProvider).agent;

    return Scaffold(
      appBar: AppBar(title: Text('admin.platformSettings'.tr())),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('admin.adminProfile'.tr(), style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(agent?.name ?? 'status.ADMIN'.tr(), style: const TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(agent?.email ?? '', style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text('admin.notificationControls'.tr(), style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          const SizedBox(height: 12),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  title: Text('admin.pushNotifications'.tr()),
                  subtitle: Text('admin.pushNotificationsDesc'.tr()),
                  value: _globalNotifications,
                  onChanged: (v) => setState(() => _globalNotifications = v),
                ),
                const Divider(height: 1),
                SwitchListTile(
                  title: Text('admin.verificationAlerts'.tr()),
                  subtitle: Text('admin.verificationAlertsDesc'.tr()),
                  value: _agentApprovalAlerts,
                  onChanged: (v) => setState(() => _agentApprovalAlerts = v),
                ),
                const Divider(height: 1),
                SwitchListTile(
                  title: Text('admin.weeklyDigest'.tr()),
                  subtitle: Text('admin.weeklyDigestDesc'.tr()),
                  value: _weeklyReport,
                  onChanged: (v) => setState(() => _weeklyReport = v),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : Text('common.saveChanges'.tr()),
          ),
        ],
      ),
    );
  }
}
