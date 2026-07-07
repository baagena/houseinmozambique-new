import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../models/agent.dart';
import '../../repositories/admin_repository.dart';

class AdminAgentFormScreen extends ConsumerStatefulWidget {
  final Agent? agent;
  const AdminAgentFormScreen({super.key, this.agent});

  @override
  ConsumerState<AdminAgentFormScreen> createState() => _AdminAgentFormScreenState();
}

class _AdminAgentFormScreenState extends ConsumerState<AdminAgentFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final _nameController = TextEditingController(text: widget.agent?.name);
  late final _emailController = TextEditingController(text: widget.agent?.email);
  final _passwordController = TextEditingController();
  late final _titleController = TextEditingController(text: widget.agent?.title);
  late final _locationController = TextEditingController(text: widget.agent?.location);
  late final _phoneController = TextEditingController(text: widget.agent?.phone);
  late final _bioController = TextEditingController(text: widget.agent?.bio);
  late final _yearsController = TextEditingController(text: widget.agent?.yearsExperience?.toString());
  late final _specController = TextEditingController(text: widget.agent?.specializations.join(', '));
  late bool _isAdmin = widget.agent?.isAdmin ?? false;
  late bool _isVerified = widget.agent?.isVerified ?? true;
  bool _submitting = false;

  bool get _isEditing => widget.agent != null;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _titleController.dispose();
    _locationController.dispose();
    _phoneController.dispose();
    _bioController.dispose();
    _yearsController.dispose();
    _specController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    final fields = {
      'name': _nameController.text.trim(),
      'email': _emailController.text.trim(),
      if (_passwordController.text.isNotEmpty) 'password': _passwordController.text,
      'title': _titleController.text.trim(),
      'location': _locationController.text.trim(),
      'phone': _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
      'bio': _bioController.text.trim(),
      'yearsExperience': int.tryParse(_yearsController.text.trim()) ?? 0,
      'specializations': _specController.text.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList(),
      'isVerified': _isVerified,
      'role': _isAdmin ? 'ADMIN' : 'AGENT',
    };
    try {
      if (_isEditing) {
        await ref.read(adminRepositoryProvider).updateAgent(widget.agent!.id, fields);
      } else {
        await ref.read(adminRepositoryProvider).createAgent(fields);
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      final message = e.asApiException?.message ?? 'Something went wrong';
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEditing ? 'Edit agent' : 'New agent')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Full name'),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _emailController,
                enabled: !_isEditing,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email'),
                validator: (v) => (v == null || !v.contains('@')) ? 'Valid email required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _passwordController,
                obscureText: true,
                decoration: InputDecoration(labelText: _isEditing ? 'New password (optional)' : 'Password'),
                validator: (v) {
                  if (_isEditing) return null;
                  return (v == null || v.length < 6) ? 'Min 6 characters' : null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(labelText: 'Professional title'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _locationController,
                decoration: const InputDecoration(labelText: 'Location'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: 'Phone (optional)'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _yearsController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Years of experience'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _specController,
                decoration: const InputDecoration(labelText: 'Specializations (comma separated)'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _bioController,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Bio'),
              ),
              const SizedBox(height: 8),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Verified agent'),
                value: _isVerified,
                onChanged: (v) => setState(() => _isVerified = v),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Admin role'),
                subtitle: const Text('Grants full platform administration access'),
                value: _isAdmin,
                onChanged: (v) => setState(() => _isAdmin = v),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _submitting ? null : _submit,
                child: _submitting
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(_isEditing ? 'Save changes' : 'Create agent'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
