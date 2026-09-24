import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../models/property.dart';
import '../../repositories/admin_repository.dart';
import '../../core/utils/labels.dart';

const _propertyTypes = ['Villa', 'Apartment', 'House', 'Land', 'Commercial'];
const _listingTypes = ['Buy', 'Rent', 'Short Stay'];

class AdminPropertyFormScreen extends ConsumerStatefulWidget {
  final Property property;
  const AdminPropertyFormScreen({super.key, required this.property});

  @override
  ConsumerState<AdminPropertyFormScreen> createState() => _AdminPropertyFormScreenState();
}

class _AdminPropertyFormScreenState extends ConsumerState<AdminPropertyFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final _titleController = TextEditingController(text: widget.property.title);
  late final _descriptionController = TextEditingController(text: widget.property.description);
  late final _cityController = TextEditingController(text: widget.property.city);
  late final _addressController = TextEditingController(text: widget.property.address ?? '');
  late final _priceController = TextEditingController(text: widget.property.price.toStringAsFixed(0));
  late final _bedroomsController = TextEditingController(text: '${widget.property.bedrooms}');
  late final _bathroomsController = TextEditingController(text: '${widget.property.bathrooms}');
  late final _areaController = TextEditingController(text: widget.property.area.toStringAsFixed(0));

  late String _propertyType = _propertyTypes.contains(widget.property.type) ? widget.property.type : _propertyTypes.first;
  late String _listingType = _listingTypes.contains(widget.property.listingType) ? widget.property.listingType : _listingTypes.first;
  bool _submitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _cityController.dispose();
    _addressController.dispose();
    _priceController.dispose();
    _bedroomsController.dispose();
    _bathroomsController.dispose();
    _areaController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    final fields = {
      'title': _titleController.text.trim(),
      'description': _descriptionController.text.trim(),
      'city': _cityController.text.trim(),
      'address': _addressController.text.trim(),
      'price': double.tryParse(_priceController.text.trim()) ?? widget.property.price,
      'priceUnit': widget.property.priceUnit,
      'type': _propertyType,
      'listingType': _listingType,
      'bedrooms': int.tryParse(_bedroomsController.text.trim()) ?? widget.property.bedrooms,
      'bathrooms': int.tryParse(_bathroomsController.text.trim()) ?? widget.property.bathrooms,
      'area': double.tryParse(_areaController.text.trim()) ?? widget.property.area,
      'amenities': widget.property.amenities,
      'images': widget.property.images,
      'tags': widget.property.tags,
    };
    try {
      await ref.read(adminRepositoryProvider).updateProperty(widget.property.id, fields);
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      final message = e.asApiException?.message ?? 'common.somethingWentWrong'.tr();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _delete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('admin.deleteListingTitle'.tr()),
        content: Text('admin.deleteListingBody'.tr(args: [widget.property.title])),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('common.cancel'.tr())),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text('common.delete'.tr())),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ref.read(adminRepositoryProvider).deleteProperty(widget.property.id);
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      final message = e.asApiException?.message ?? 'admin.deleteFailed'.tr();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    }
  }

  Future<void> _setStatus(String status) async {
    try {
      await ref.read(adminRepositoryProvider).setPropertyStatus(widget.property.id, status);
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      final message = e.asApiException?.message ?? 'admin.statusFailed'.tr();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('admin.editProperty'.tr()),
        actions: [
          IconButton(icon: const Icon(Icons.delete_outline), onPressed: _delete),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (widget.property.status != 'PUBLISHED')
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(foregroundColor: AppColors.error),
                          icon: const Icon(Icons.close, size: 18),
                          label: Text('common.reject'.tr()),
                          onPressed: () => _setStatus('REJECTED'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton.icon(
                          icon: const Icon(Icons.check, size: 18),
                          label: Text('common.approve'.tr()),
                          onPressed: () => _setStatus('PUBLISHED'),
                        ),
                      ),
                    ],
                  ),
                ),
              TextFormField(
                controller: _titleController,
                decoration: InputDecoration(labelText: 'admin.title'.tr()),
                validator: (v) => v == null || v.isEmpty ? ' ' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _descriptionController,
                maxLines: 3,
                decoration: InputDecoration(labelText: 'admin.description'.tr()),
                validator: (v) => v == null || v.isEmpty ? ' ' : null,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _listingType,
                      decoration: InputDecoration(labelText: 'listingForm.listingType'.tr()),
                      items: _listingTypes.map((t) => DropdownMenuItem(value: t, child: Text(listingTypeLabel(t)))).toList(),
                      onChanged: (v) => setState(() => _listingType = v!),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _propertyType,
                      decoration: InputDecoration(labelText: 'listingForm.propertyType'.tr()),
                      items: _propertyTypes.map((t) => DropdownMenuItem(value: t, child: Text(propertyTypeLabel(t)))).toList(),
                      onChanged: (v) => setState(() => _propertyType = v!),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(controller: _cityController, decoration: InputDecoration(labelText: 'listingForm.city'.tr()), validator: (v) => v == null || v.isEmpty ? ' ' : null),
              const SizedBox(height: 12),
              TextFormField(controller: _addressController, decoration: InputDecoration(labelText: 'listingForm.address'.tr())),
              const SizedBox(height: 12),
              TextFormField(
                controller: _priceController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(labelText: 'listingForm.price'.tr()),
                validator: (v) => v == null || double.tryParse(v) == null ? ' ' : null,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: TextFormField(controller: _bedroomsController, keyboardType: TextInputType.number, decoration: InputDecoration(labelText: 'listingForm.bedrooms'.tr()))),
                  const SizedBox(width: 12),
                  Expanded(child: TextFormField(controller: _bathroomsController, keyboardType: TextInputType.number, decoration: InputDecoration(labelText: 'listingForm.bathrooms'.tr()))),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(controller: _areaController, keyboardType: TextInputType.number, decoration: InputDecoration(labelText: 'listingForm.area'.tr())),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _submitting ? null : _submit,
                child: _submitting
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text('common.saveChanges'.tr()),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
