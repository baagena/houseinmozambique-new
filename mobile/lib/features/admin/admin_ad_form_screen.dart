import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../models/advertisement.dart';
import '../../repositories/admin_repository.dart';

const _positions = ['after_featured', 'between_cities_1', 'between_cities_2', 'before_footer', 'sidebar_strip', 'top_banner'];
const _types = ['banner', 'card_row', 'strip'];

class AdminAdFormScreen extends ConsumerStatefulWidget {
  final Advertisement? ad;
  const AdminAdFormScreen({super.key, this.ad});

  @override
  ConsumerState<AdminAdFormScreen> createState() => _AdminAdFormScreenState();
}

class _AdminAdFormScreenState extends ConsumerState<AdminAdFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final _titleController = TextEditingController(text: widget.ad?.title);
  late final _descriptionController = TextEditingController(text: widget.ad?.description);
  late final _imageUrlController = TextEditingController(text: widget.ad?.imageUrl);
  late final _linkUrlController = TextEditingController(text: widget.ad?.linkUrl);
  late final _linkTextController = TextEditingController(text: widget.ad?.linkText);
  late final _bgColorController = TextEditingController(text: widget.ad?.bgColor ?? '#1a3c5e');
  late final _textColorController = TextEditingController(text: widget.ad?.textColor ?? '#ffffff');

  late String _position = _positions.contains(widget.ad?.position) ? widget.ad!.position : _positions.first;
  late String _type = _types.contains(widget.ad?.type) ? widget.ad!.type : _types.first;
  late bool _isActive = widget.ad?.isActive ?? true;
  bool _submitting = false;

  bool get _isEditing => widget.ad != null;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _imageUrlController.dispose();
    _linkUrlController.dispose();
    _linkTextController.dispose();
    _bgColorController.dispose();
    _textColorController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    final fields = {
      'title': _titleController.text.trim(),
      'description': _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
      'imageUrl': _imageUrlController.text.trim().isEmpty ? null : _imageUrlController.text.trim(),
      'linkUrl': _linkUrlController.text.trim().isEmpty ? null : _linkUrlController.text.trim(),
      'linkText': _linkTextController.text.trim().isEmpty ? null : _linkTextController.text.trim(),
      'position': _position,
      'type': _type,
      'bgColor': _bgColorController.text.trim(),
      'textColor': _textColorController.text.trim(),
      'isActive': _isActive,
    };
    try {
      if (_isEditing) {
        await ref.read(adminRepositoryProvider).updateAd(widget.ad!.id, fields);
      } else {
        await ref.read(adminRepositoryProvider).createAd(fields);
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
      appBar: AppBar(title: Text(_isEditing ? 'Edit ad' : 'New ad')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(labelText: 'Title'),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(controller: _descriptionController, decoration: const InputDecoration(labelText: 'Description (optional)')),
              const SizedBox(height: 12),
              TextFormField(controller: _imageUrlController, decoration: const InputDecoration(labelText: 'Image URL (optional)')),
              const SizedBox(height: 12),
              TextFormField(controller: _linkUrlController, decoration: const InputDecoration(labelText: 'Link URL (optional)')),
              const SizedBox(height: 12),
              TextFormField(controller: _linkTextController, decoration: const InputDecoration(labelText: 'Link text (optional)')),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _position,
                decoration: const InputDecoration(labelText: 'Position'),
                items: _positions.map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
                onChanged: (v) => setState(() => _position = v!),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _type,
                decoration: const InputDecoration(labelText: 'Type'),
                items: _types.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                onChanged: (v) => setState(() => _type = v!),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: TextFormField(controller: _bgColorController, decoration: const InputDecoration(labelText: 'Background color'))),
                  const SizedBox(width: 12),
                  Expanded(child: TextFormField(controller: _textColorController, decoration: const InputDecoration(labelText: 'Text color'))),
                ],
              ),
              const SizedBox(height: 8),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Active'),
                value: _isActive,
                onChanged: (v) => setState(() => _isActive = v),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _submitting ? null : _submit,
                child: _submitting
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(_isEditing ? 'Save changes' : 'Create ad'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
