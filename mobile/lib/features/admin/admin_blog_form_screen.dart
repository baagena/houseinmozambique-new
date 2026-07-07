import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../models/blog_post.dart';
import '../../repositories/admin_repository.dart';

class AdminBlogFormScreen extends ConsumerStatefulWidget {
  final BlogPost? post;
  const AdminBlogFormScreen({super.key, this.post});

  @override
  ConsumerState<AdminBlogFormScreen> createState() => _AdminBlogFormScreenState();
}

class _AdminBlogFormScreenState extends ConsumerState<AdminBlogFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final _titleController = TextEditingController(text: widget.post?.title);
  late final _excerptController = TextEditingController(text: widget.post?.excerpt);
  late final _contentController = TextEditingController(text: widget.post?.content);
  late final _coverImageController = TextEditingController(text: widget.post?.coverImage);
  late final _categoryController = TextEditingController(text: widget.post?.category ?? 'Market Insight');
  late final _tagsController = TextEditingController(text: widget.post?.tags.join(', '));
  late bool _isFeatured = widget.post?.isFeatured ?? false;
  late bool _isPublished = widget.post?.status == 'PUBLISHED';
  bool _submitting = false;

  bool get _isEditing => widget.post != null;

  @override
  void dispose() {
    _titleController.dispose();
    _excerptController.dispose();
    _contentController.dispose();
    _coverImageController.dispose();
    _categoryController.dispose();
    _tagsController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    final fields = {
      'title': _titleController.text.trim(),
      'excerpt': _excerptController.text.trim(),
      'content': _contentController.text.trim(),
      'coverImage': _coverImageController.text.trim().isEmpty ? null : _coverImageController.text.trim(),
      'category': _categoryController.text.trim(),
      'tags': _tagsController.text.split(',').map((t) => t.trim()).where((t) => t.isNotEmpty).toList(),
      'isFeatured': _isFeatured,
      'status': _isPublished ? 'PUBLISHED' : 'DRAFT',
    };
    try {
      if (_isEditing) {
        await ref.read(adminRepositoryProvider).updateBlogPost(widget.post!.id, fields);
      } else {
        await ref.read(adminRepositoryProvider).createBlogPost(fields);
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
      appBar: AppBar(title: Text(_isEditing ? 'Edit article' : 'New article')),
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
              TextFormField(
                controller: _excerptController,
                maxLines: 2,
                decoration: const InputDecoration(labelText: 'Excerpt'),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _contentController,
                maxLines: 8,
                decoration: const InputDecoration(labelText: 'Content', alignLabelWithHint: true),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(controller: _coverImageController, decoration: const InputDecoration(labelText: 'Cover image URL (optional)')),
              const SizedBox(height: 12),
              TextFormField(controller: _categoryController, decoration: const InputDecoration(labelText: 'Category')),
              const SizedBox(height: 12),
              TextFormField(controller: _tagsController, decoration: const InputDecoration(labelText: 'Tags (comma separated)')),
              const SizedBox(height: 8),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Featured'),
                value: _isFeatured,
                onChanged: (v) => setState(() => _isFeatured = v),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Published'),
                subtitle: const Text('Off saves as a draft'),
                value: _isPublished,
                onChanged: (v) => setState(() => _isPublished = v),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _submitting ? null : _submit,
                child: _submitting
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(_isEditing ? 'Save changes' : 'Create article'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
