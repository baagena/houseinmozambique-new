import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../repositories/agent_dashboard_repository.dart';

class AgentProfileScreen extends ConsumerStatefulWidget {
  const AgentProfileScreen({super.key});

  @override
  ConsumerState<AgentProfileScreen> createState() => _AgentProfileScreenState();
}

class _AgentProfileScreenState extends ConsumerState<AgentProfileScreen> {
  late final _nameController = TextEditingController(text: agent?.name);
  late final _titleController = TextEditingController(text: agent?.title);
  late final _locationController = TextEditingController(text: agent?.location);
  late final _bioController = TextEditingController(text: agent?.bio);
  late final _phoneController = TextEditingController(text: agent?.phone);
  bool _saving = false;

  get agent => ref.read(authControllerProvider).agent;

  @override
  void dispose() {
    _nameController.dispose();
    _titleController.dispose();
    _locationController.dispose();
    _bioController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final repo = ref.read(agentDashboardRepositoryProvider);
      final updated = await repo.updateProfile({
        'name': _nameController.text.trim(),
        'title': _titleController.text.trim(),
        'location': _locationController.text.trim(),
        'bio': _bioController.text.trim(),
      });
      await repo.updateSettings(phone: _phoneController.text.trim());
      ref.read(authControllerProvider.notifier).updateAgent(updated);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('common.save'.tr())));
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
    return Scaffold(
      appBar: AppBar(
        title: Text('dashboard.profile'.tr()),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await ref.read(authControllerProvider.notifier).logout();
              if (context.mounted) context.go('/profile');
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          TextField(controller: _nameController, decoration: InputDecoration(labelText: 'auth.fullName'.tr())),
          const SizedBox(height: 12),
          TextField(controller: _titleController, decoration: const InputDecoration(labelText: 'Title')),
          const SizedBox(height: 12),
          TextField(controller: _locationController, decoration: const InputDecoration(labelText: 'Location')),
          const SizedBox(height: 12),
          TextField(controller: _phoneController, decoration: const InputDecoration(labelText: 'Phone'), keyboardType: TextInputType.phone),
          const SizedBox(height: 12),
          TextField(controller: _bioController, maxLines: 4, decoration: const InputDecoration(labelText: 'Bio')),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : Text('common.save'.tr()),
          ),
        ],
      ),
    );
  }
}
