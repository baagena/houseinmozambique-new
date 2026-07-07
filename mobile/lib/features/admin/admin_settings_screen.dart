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
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Settings updated successfully')));
  }

  @override
  Widget build(BuildContext context) {
    final agent = ref.watch(authControllerProvider).agent;

    return Scaffold(
      appBar: AppBar(title: const Text('Platform settings')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text('Administrative profile', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(agent?.name ?? 'Admin', style: const TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(agent?.email ?? '', style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          const Text('Notification controls', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          const SizedBox(height: 12),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('Push notifications'),
                  subtitle: const Text('Real-time alerts for platform activity'),
                  value: _globalNotifications,
                  onChanged: (v) => setState(() => _globalNotifications = v),
                ),
                const Divider(height: 1),
                SwitchListTile(
                  title: const Text('Agent verification alerts'),
                  subtitle: const Text('Notify immediately when a new agent applies'),
                  value: _agentApprovalAlerts,
                  onChanged: (v) => setState(() => _agentApprovalAlerts = v),
                ),
                const Divider(height: 1),
                SwitchListTile(
                  title: const Text('Executive weekly digest'),
                  subtitle: const Text('Automated growth and revenue report'),
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
                : const Text('Save changes'),
          ),
        ],
      ),
    );
  }
}
