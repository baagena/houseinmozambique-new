import 'dart:convert';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../models/property.dart';
import '../../repositories/agent_dashboard_repository.dart';
import '../../repositories/property_repository.dart';

const _propertyTypes = ['Villa', 'Apartment', 'House', 'Land', 'Commercial'];
const _listingTypes = ['Buy', 'Rent', 'Short Stay'];

class ListingFormScreen extends ConsumerStatefulWidget {
  final String? propertyId;
  const ListingFormScreen({super.key, this.propertyId});

  bool get isEditing => propertyId != null;

  @override
  ConsumerState<ListingFormScreen> createState() => _ListingFormScreenState();
}

class _ListingFormScreenState extends ConsumerState<ListingFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _cityController = TextEditingController();
  final _addressController = TextEditingController();
  final _priceController = TextEditingController();
  final _bedroomsController = TextEditingController(text: '1');
  final _bathroomsController = TextEditingController(text: '1');
  final _areaController = TextEditingController();

  String _propertyType = _propertyTypes.first;
  String _listingType = _listingTypes.first;
  final List<String> _images = [];
  bool _loading = false;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.isEditing) _loadExisting();
  }

  Future<void> _loadExisting() async {
    setState(() => _loading = true);
    try {
      final (property, _) = await ref.read(propertyRepositoryProvider).getById(widget.propertyId!);
      _titleController.text = property.title;
      _descriptionController.text = property.description;
      _cityController.text = property.city;
      _addressController.text = property.address ?? '';
      _priceController.text = property.price.toStringAsFixed(0);
      _bedroomsController.text = '${property.bedrooms}';
      _bathroomsController.text = '${property.bathrooms}';
      _areaController.text = property.area.toStringAsFixed(0);
      _propertyType = property.type;
      _listingType = property.listingType;
      _images.addAll(property.images);
    } catch (_) {
      // Editing form will just start blank if the fetch fails.
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

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

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (file == null) return;
    final bytes = await file.readAsBytes();
    final mime = file.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    final base64Str = 'data:$mime;base64,${base64Encode(bytes)}';
    setState(() => _loading = true);
    try {
      final url = await ref.read(agentDashboardRepositoryProvider).uploadImage(base64Str);
      setState(() => _images.add(url));
    } catch (e) {
      if (mounted) {
        final message = e.asApiException?.message ?? 'common.somethingWentWrong'.tr();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    final formData = {
      'title': _titleController.text.trim(),
      'description': _descriptionController.text.trim(),
      'city': _cityController.text.trim(),
      'address': _addressController.text.trim(),
      'price': _priceController.text.trim(),
      'priceUnit': _listingType == 'Buy' ? 'sale' : (_listingType == 'Rent' ? 'monthly' : 'nightly'),
      'propertyType': _propertyType,
      'listingType': _listingType,
      'bedrooms': _bedroomsController.text.trim(),
      'bathrooms': _bathroomsController.text.trim(),
      'area': _areaController.text.trim(),
      'amenities': <String>[],
    };
    try {
      final repo = ref.read(agentDashboardRepositoryProvider);
      Property result;
      if (widget.isEditing) {
        result = await repo.updateProperty(widget.propertyId!, formData, _images);
      } else {
        result = await repo.createProperty(formData, _images);
      }
      ref.invalidate(myPropertiesProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${result.title} · ${'dashboard.submit'.tr()}')));
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        final message = e.asApiException?.message ?? 'common.somethingWentWrong'.tr();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      type: MaterialType.transparency,
      child: DraggableScrollableSheet(
      initialChildSize: 0.95,
      minChildSize: 0.5,
      maxChildSize: 0.98,
      expand: false,
      builder: (context, scrollController) {
        if (_loading && widget.isEditing && _titleController.text.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }
        return Form(
          key: _formKey,
          child: ListView(
            controller: scrollController,
            padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(context).viewInsets.bottom + 20),
            children: [
              Center(
                child: Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 16), decoration: BoxDecoration(color: AppColors.outlineVariant, borderRadius: BorderRadius.circular(2))),
              ),
              Text(widget.isEditing ? 'common.edit'.tr() : 'dashboard.addListing'.tr(), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              SizedBox(
                height: 90,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    ..._images.map((url) => Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: Stack(
                            children: [
                              ClipRRect(borderRadius: BorderRadius.circular(10), child: CachedNetworkImage(imageUrl: url, width: 80, height: 80, fit: BoxFit.cover)),
                              Positioned(
                                top: 2,
                                right: 2,
                                child: GestureDetector(
                                  onTap: () => setState(() => _images.remove(url)),
                                  child: const CircleAvatar(radius: 10, backgroundColor: Colors.black54, child: Icon(Icons.close, size: 12, color: Colors.white)),
                                ),
                              ),
                            ],
                          ),
                        )),
                    GestureDetector(
                      onTap: _loading ? null : _pickImage,
                      child: Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(color: AppColors.surfaceContainer, borderRadius: BorderRadius.circular(10)),
                        child: _loading ? const Center(child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.add_a_photo_outlined),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(controller: _titleController, decoration: InputDecoration(labelText: 'dashboard.propertyTitle'.tr()), validator: (v) => v == null || v.isEmpty ? ' ' : null),
              const SizedBox(height: 12),
              TextFormField(controller: _descriptionController, maxLines: 3, decoration: InputDecoration(labelText: 'dashboard.description'.tr()), validator: (v) => v == null || v.isEmpty ? ' ' : null),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _listingType,
                      decoration: const InputDecoration(labelText: 'Listing Type'),
                      items: _listingTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                      onChanged: (v) => setState(() => _listingType = v!),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _propertyType,
                      decoration: const InputDecoration(labelText: 'Property Type'),
                      items: _propertyTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                      onChanged: (v) => setState(() => _propertyType = v!),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(controller: _cityController, decoration: InputDecoration(labelText: 'dashboard.city'.tr()), validator: (v) => v == null || v.isEmpty ? ' ' : null),
              const SizedBox(height: 12),
              TextFormField(controller: _addressController, decoration: const InputDecoration(labelText: 'Address')),
              const SizedBox(height: 12),
              TextFormField(
                controller: _priceController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(labelText: 'dashboard.price'.tr()),
                validator: (v) => v == null || double.tryParse(v) == null ? ' ' : null,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: TextFormField(controller: _bedroomsController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Bedrooms'))),
                  const SizedBox(width: 12),
                  Expanded(child: TextFormField(controller: _bathroomsController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Bathrooms'))),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(controller: _areaController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Area (m²)')),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _submitting ? null : _submit,
                child: _submitting
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text('dashboard.submit'.tr()),
              ),
            ],
          ),
        );
      },
      ),
    );
  }
}
