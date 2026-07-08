import 'dart:convert';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../controllers/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../models/property.dart';
import '../../repositories/agent_dashboard_repository.dart';
import '../../repositories/payment_repository.dart';
import '../../repositories/property_repository.dart';

// Kept identical to the website's post-property form (src/app/post-property/page.tsx)
// so listings created from either app end up structured the same way.
const _propertyTypes = ['House', 'Villa', 'Apartment', 'Penthouse', 'Land', 'Bungalow', 'Lodge'];
const _listingTypes = ['Buy', 'Rent', 'Short Stay', 'Auction'];
const _amenitiesList = [
  'WiFi', 'Pool', 'Security', 'Parking', 'Air Conditioning', 'Garden',
  'Ocean View', 'Solar Power', 'Generator', 'Staff Quarters', 'Gym', 'Private Beach',
];

enum _Phase { plan, details, payment }

const _planTiers = [
  (id: 'standard', nameKey: 'plans.standardName', priceKey: 'plans.standardPrice', descKey: 'plans.standardDesc', ctaKey: 'plans.standardCta', amount: 0, highlighted: false, selectable: true),
  (id: 'premium', nameKey: 'plans.premiumName', priceKey: 'plans.premiumPrice', descKey: 'plans.premiumDesc', ctaKey: 'plans.premiumCta', amount: 3500, highlighted: true, selectable: true),
  (id: 'pro', nameKey: 'plans.proName', priceKey: 'plans.proPrice', descKey: 'plans.proDesc', ctaKey: 'plans.proCta', amount: 0, highlighted: false, selectable: false),
];

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
  final _neighborhoodController = TextEditingController();
  final _addressController = TextEditingController();
  final _priceController = TextEditingController();
  final _bedroomsController = TextEditingController(text: '1');
  final _bathroomsController = TextEditingController(text: '1');
  final _areaController = TextEditingController();
  final _latitudeController = TextEditingController();
  final _longitudeController = TextEditingController();
  final _agentPhoneController = TextEditingController();
  final _whatsappController = TextEditingController();
  final _contactEmailController = TextEditingController();
  final _responseTimeController = TextEditingController();
  final _payerNameController = TextEditingController();
  final _transactionRefController = TextEditingController();

  String _propertyType = _propertyTypes.first;
  String _listingType = _listingTypes.first;
  final List<String> _images = [];
  final List<String> _selectedAmenities = [];
  bool _loading = false;
  bool _submitting = false;

  late _Phase _phase = widget.isEditing ? _Phase.details : _Phase.plan;
  String _selectedPlan = 'standard';
  String _paymentTab = 'mobile';
  bool _agreedToTerms = false;

  int get _planAmount => _planTiers.firstWhere((p) => p.id == _selectedPlan).amount;

  @override
  void initState() {
    super.initState();
    if (widget.isEditing) {
      _loadExisting();
    } else {
      _payerNameController.text = ref.read(authControllerProvider).agent?.name ?? '';
    }
  }

  Future<void> _loadExisting() async {
    setState(() => _loading = true);
    try {
      final (property, _) = await ref.read(propertyRepositoryProvider).getById(widget.propertyId!);
      _titleController.text = property.title;
      _descriptionController.text = property.description;
      _cityController.text = property.city;
      _neighborhoodController.text = property.neighborhood ?? '';
      _addressController.text = property.address ?? '';
      _priceController.text = property.price.toStringAsFixed(0);
      _bedroomsController.text = '${property.bedrooms}';
      _bathroomsController.text = '${property.bathrooms}';
      _areaController.text = property.area.toStringAsFixed(0);
      _propertyType = property.type;
      _listingType = property.listingType;
      _images.addAll(property.images);
      _selectedAmenities.addAll(property.amenities);
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
    _neighborhoodController.dispose();
    _addressController.dispose();
    _priceController.dispose();
    _bedroomsController.dispose();
    _bathroomsController.dispose();
    _areaController.dispose();
    _latitudeController.dispose();
    _longitudeController.dispose();
    _agentPhoneController.dispose();
    _whatsappController.dispose();
    _contactEmailController.dispose();
    _responseTimeController.dispose();
    _payerNameController.dispose();
    _transactionRefController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    // Downscale on-device: a full-resolution camera photo encoded as base64
    // exceeds the API's request body limit, so the upload fails and the photo
    // never shows up in the form.
    final files = await picker.pickMultiImage(imageQuality: 75, maxWidth: 1600, maxHeight: 1600);
    if (files.isEmpty || !mounted) return;
    setState(() => _loading = true);
    try {
      for (final file in files) {
        final bytes = await file.readAsBytes();
        final mime = file.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        final base64Str = 'data:$mime;base64,${base64Encode(bytes)}';
        final url = await ref.read(agentDashboardRepositoryProvider).uploadImage(base64Str);
        if (!mounted) return;
        setState(() => _images.add(url));
      }
    } catch (e) {
      if (mounted) {
        final message = e.asApiException?.message ?? 'dashboard.imagePickerError'.tr();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _selectPlan(String planId) {
    final plan = _planTiers.firstWhere((p) => p.id == planId);
    if (!plan.selectable) {
      final router = GoRouter.of(context);
      // This sheet can be the only route on the stack (e.g. right after a
      // login redirect); popping then would leave a black screen behind.
      if (router.canPop()) {
        router.pop();
      } else {
        router.go('/profile');
      }
      router.push('/contact');
      return;
    }
    setState(() {
      _selectedPlan = planId;
      _phase = _Phase.details;
    });
  }

  void _onDetailsContinue() {
    if (!_formKey.currentState!.validate()) return;
    if (_planAmount == 0) {
      _submit();
    } else {
      setState(() => _phase = _Phase.payment);
    }
  }

  Future<void> _submitPayment() async {
    if (_payerNameController.text.trim().isEmpty || _transactionRefController.text.trim().isEmpty || !_agreedToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('dashboard.paymentFillRequired'.tr())));
      return;
    }
    setState(() => _submitting = true);
    try {
      final agent = ref.read(authControllerProvider).agent!;
      await ref.read(paymentRepositoryProvider).submitManualPayment(
            amount: _planAmount,
            planType: _selectedPlan,
            userId: agent.id,
            customerName: _payerNameController.text.trim(),
            customerEmail: agent.email ?? '',
            paymentReference: _transactionRefController.text.trim(),
          );
      await _submit();
    } catch (e) {
      if (mounted) {
        final message = e.asApiException?.message ?? 'common.somethingWentWrong'.tr();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
        setState(() => _submitting = false);
      }
    }
  }

  /// Mirrors the website's buildDescription() (src/app/post-property/page.tsx) —
  /// coordinates and agent contact details aren't separate Property columns, so
  /// the website folds them into the description text. Matching that here keeps
  /// listings structured the same regardless of which app created them.
  String _buildDescription() {
    final lines = [_descriptionController.text.trim()];
    if (_latitudeController.text.trim().isNotEmpty && _longitudeController.text.trim().isNotEmpty) {
      lines.add('Coordinates: ${_latitudeController.text.trim()}, ${_longitudeController.text.trim()}');
    }
    final contactLines = [
      if (_agentPhoneController.text.trim().isNotEmpty) 'Agent phone: ${_agentPhoneController.text.trim()}',
      if (_whatsappController.text.trim().isNotEmpty) 'WhatsApp: ${_whatsappController.text.trim()}',
      if (_contactEmailController.text.trim().isNotEmpty) 'Contact email: ${_contactEmailController.text.trim()}',
      if (_responseTimeController.text.trim().isNotEmpty) 'Preferred response time: ${_responseTimeController.text.trim()}',
    ];
    if (contactLines.isNotEmpty) lines.add(contactLines.join('\n'));
    return lines.where((l) => l.isNotEmpty).join('\n\n');
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    final formData = {
      'title': _titleController.text.trim(),
      'description': _buildDescription(),
      'city': _cityController.text.trim(),
      'neighborhood': _neighborhoodController.text.trim(),
      'address': _addressController.text.trim(),
      'price': _priceController.text.trim(),
      'priceUnit': _listingType == 'Rent' ? 'monthly' : (_listingType == 'Short Stay' ? 'nightly' : 'sale'),
      'propertyType': _propertyType,
      'listingType': _listingType,
      'bedrooms': _bedroomsController.text.trim(),
      'bathrooms': _bathroomsController.text.trim(),
      'area': _areaController.text.trim(),
      'amenities': _selectedAmenities,
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
        final router = GoRouter.of(context);
        if (router.canPop()) {
          router.pop();
        } else {
          router.go('/dashboard/listings');
        }
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('dashboard.listingSubmitted'.tr(args: [result.title])),
          behavior: SnackBarBehavior.floating,
        ));
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
          return Container(
            decoration: const BoxDecoration(
              color: AppColors.surfaceContainerLowest,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: _loading && widget.isEditing && _titleController.text.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : switch (_phase) {
                    _Phase.plan => _buildPlanPhase(scrollController),
                    _Phase.details => _buildDetailsPhase(scrollController),
                    _Phase.payment => _buildPaymentPhase(scrollController),
                  },
          );
        },
      ),
    );
  }

  Widget _sheetHandle() => Center(
        child: Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 16), decoration: BoxDecoration(color: AppColors.outlineVariant, borderRadius: BorderRadius.circular(2))),
      );

  Widget _buildPlanPhase(ScrollController scrollController) {
    return ListView(
      controller: scrollController,
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
      children: [
        _sheetHandle(),
        Text('dashboard.selectPlanTitle'.tr(), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text('dashboard.selectPlanSubtitle'.tr(), style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13)),
        const SizedBox(height: 20),
        ..._planTiers.map((plan) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _PlanCard(
                name: plan.nameKey.tr(),
                price: plan.priceKey.tr(),
                description: plan.descKey.tr(),
                cta: plan.ctaKey.tr(),
                badge: plan.highlighted ? 'plans.premiumBadge'.tr() : null,
                highlighted: plan.highlighted,
                onTap: () => _selectPlan(plan.id),
              ),
            )),
      ],
    );
  }

  Widget _buildDetailsPhase(ScrollController scrollController) {
    return Form(
      key: _formKey,
      child: ListView(
        controller: scrollController,
        padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(context).viewInsets.bottom + 20),
        children: [
          _sheetHandle(),
          Row(
            children: [
              if (!widget.isEditing)
                IconButton(
                  onPressed: () => setState(() => _phase = _Phase.plan),
                  icon: const Icon(Icons.arrow_back),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                ),
              Text(widget.isEditing ? 'common.edit'.tr() : 'dashboard.addListing'.tr(), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ],
          ),
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
          TextFormField(controller: _neighborhoodController, decoration: const InputDecoration(labelText: 'Neighborhood')),
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
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: TextFormField(controller: _latitudeController, keyboardType: const TextInputType.numberWithOptions(signed: true, decimal: true), decoration: const InputDecoration(labelText: 'Latitude'))),
              const SizedBox(width: 12),
              Expanded(child: TextFormField(controller: _longitudeController, keyboardType: const TextInputType.numberWithOptions(signed: true, decimal: true), decoration: const InputDecoration(labelText: 'Longitude'))),
            ],
          ),
          const SizedBox(height: 20),
          Text('dashboard.amenitiesLabel'.tr(), style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _amenitiesList.map((amenity) {
              final selected = _selectedAmenities.contains(amenity);
              return FilterChip(
                label: Text(amenity),
                selected: selected,
                onSelected: (v) => setState(() => v ? _selectedAmenities.add(amenity) : _selectedAmenities.remove(amenity)),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),
          Text('dashboard.agentContactLabel'.tr(), style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 10),
          TextFormField(controller: _agentPhoneController, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Agent phone number')),
          const SizedBox(height: 12),
          TextFormField(controller: _whatsappController, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'WhatsApp number')),
          const SizedBox(height: 12),
          TextFormField(controller: _contactEmailController, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Contact email')),
          const SizedBox(height: 12),
          TextFormField(controller: _responseTimeController, decoration: const InputDecoration(labelText: 'Preferred response time', hintText: '09:00 - 18:00')),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _submitting ? null : (widget.isEditing ? _submit : _onDetailsContinue),
            child: _submitting
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : Text(widget.isEditing || _planAmount == 0 ? 'dashboard.submit'.tr() : 'dashboard.continueToPayment'.tr()),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentPhase(ScrollController scrollController) {
    return ListView(
      controller: scrollController,
      padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(context).viewInsets.bottom + 20),
      children: [
        _sheetHandle(),
        Row(
          children: [
            IconButton(
              onPressed: () => setState(() => _phase = _Phase.details),
              icon: const Icon(Icons.arrow_back),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            ),
            Text('dashboard.paymentTitle'.tr(), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _PaymentTabButton(
                label: 'dashboard.mobileMoney'.tr(),
                icon: Icons.smartphone,
                selected: _paymentTab == 'mobile',
                onTap: () => setState(() => _paymentTab = 'mobile'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _PaymentTabButton(
                label: 'dashboard.bankTransfer'.tr(),
                icon: Icons.account_balance,
                selected: _paymentTab == 'bank',
                onTap: () => setState(() => _paymentTab = 'bank'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (_paymentTab == 'mobile')
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppColors.surfaceContainer, borderRadius: BorderRadius.circular(14)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _StepLine(number: 1, text: 'dashboard.dialInstruction'.tr()),
                const SizedBox(height: 10),
                _StepLine(number: 2, text: 'dashboard.merchantCodeInstruction'.tr(args: ['102934', _planAmount.toString()])),
                const SizedBox(height: 10),
                _StepLine(number: 3, text: 'dashboard.enterRefInstruction'.tr()),
              ],
            ),
          )
        else
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppColors.surfaceContainer, borderRadius: BorderRadius.circular(14)),
            child: Column(
              children: [
                _BankRow(label: 'dashboard.bankName'.tr(), value: 'Millennium bim'),
                _BankRow(label: 'dashboard.accountName'.tr(), value: 'House in Mozambique, Lda'),
                _BankRow(label: 'dashboard.accountNumber'.tr(), value: '123 456 789 101'),
                _BankRow(label: 'dashboard.amount'.tr(), value: '$_planAmount MZN', isLast: true),
              ],
            ),
          ),
        const SizedBox(height: 16),
        TextFormField(controller: _payerNameController, decoration: InputDecoration(labelText: 'dashboard.payerName'.tr())),
        const SizedBox(height: 12),
        TextFormField(controller: _transactionRefController, decoration: InputDecoration(labelText: 'dashboard.transactionRef'.tr())),
        const SizedBox(height: 12),
        Text('dashboard.activationNotice'.tr(), style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
        const SizedBox(height: 16),
        CheckboxListTile(
          contentPadding: EdgeInsets.zero,
          controlAffinity: ListTileControlAffinity.leading,
          value: _agreedToTerms,
          onChanged: (v) => setState(() => _agreedToTerms = v ?? false),
          title: Text('dashboard.termsAgree'.tr(), style: const TextStyle(fontSize: 13)),
        ),
        const SizedBox(height: 12),
        ElevatedButton(
          onPressed: _submitting ? null : _submitPayment,
          child: _submitting
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : Text('dashboard.publishAd'.tr()),
        ),
      ],
    );
  }
}

class _PlanCard extends StatelessWidget {
  final String name;
  final String price;
  final String description;
  final String cta;
  final String? badge;
  final bool highlighted;
  final VoidCallback onTap;

  const _PlanCard({
    required this.name,
    required this.price,
    required this.description,
    required this.cta,
    required this.badge,
    required this.highlighted,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: highlighted ? AppColors.primary : AppColors.surfaceContainer,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(name, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: highlighted ? Colors.white : AppColors.onSurface)),
              ),
              if (badge != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: AppColors.secondary, borderRadius: BorderRadius.circular(12)),
                  child: Text(badge!, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white)),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Text(price, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: highlighted ? Colors.white : AppColors.primary)),
          const SizedBox(height: 6),
          Text(description, style: TextStyle(fontSize: 12.5, color: highlighted ? Colors.white70 : AppColors.onSurfaceVariant)),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: highlighted
                ? ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: AppColors.primary),
                    onPressed: onTap,
                    child: Text(cta),
                  )
                : OutlinedButton(onPressed: onTap, child: Text(cta)),
          ),
        ],
      ),
    );
  }
}

class _PaymentTabButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;
  const _PaymentTabButton({required this.label, required this.icon, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 18),
      label: Text(label, style: const TextStyle(fontSize: 12.5)),
      style: OutlinedButton.styleFrom(
        backgroundColor: selected ? AppColors.primary : null,
        foregroundColor: selected ? Colors.white : AppColors.onSurface,
        side: BorderSide(color: selected ? AppColors.primary : AppColors.outlineVariant),
      ),
    );
  }
}

class _StepLine extends StatelessWidget {
  final int number;
  final String text;
  const _StepLine({required this.number, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        CircleAvatar(radius: 11, backgroundColor: AppColors.secondary, child: Text('$number', style: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.bold))),
        const SizedBox(width: 10),
        Expanded(child: Text(text, style: const TextStyle(fontSize: 13))),
      ],
    );
  }
}

class _BankRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isLast;
  const _BankRow({required this.label, required this.value, this.isLast = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: isLast
          ? null
          : const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.outlineVariant, width: 0.5))),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12.5, color: AppColors.onSurfaceVariant)),
          Text(value, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
