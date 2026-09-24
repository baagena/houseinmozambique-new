import 'dart:async';
import 'dart:convert';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../repositories/agent_dashboard_repository.dart';

/// What the wizard hands back when the agent presses submit.
class WizardSubmission {
  final String lang;
  final Map<String, dynamic> answers;
  final List<String> imageUrls;
  final Map<String, String> contact;
  /// Which of [imageUrls] the agent marked as interior shots.
  final Set<String> interiorUrls;
  const WizardSubmission({
    required this.lang,
    required this.answers,
    required this.imageUrls,
    required this.contact,
    this.interiorUrls = const {},
  });
}

class _Photo {
  final String url;
  bool interior = false;
  _Photo(this.url);
}

/// The guided listing, as on the web dashboard: seven steps of questions, and
/// the title and description are written by the server from the answers
/// (src/lib/listing-copy.ts). The questions, choices and their labels also
/// come from the server, in the app's language, so the two never drift.
class ListingWizard extends ConsumerStatefulWidget {
  final ScrollController scrollController;
  final String submitLabel;

  /// Shown as a back arrow on the first step (e.g. back to the plan picker).
  final VoidCallback? onExit;
  final Future<void> Function(WizardSubmission submission) onComplete;

  /// Answers to start from, e.g. when coming back from the payment step.
  final WizardSubmission? initial;

  const ListingWizard({
    super.key,
    required this.scrollController,
    required this.submitLabel,
    required this.onComplete,
    this.onExit,
    this.initial,
  });

  @override
  ConsumerState<ListingWizard> createState() => _ListingWizardState();
}

class _ListingWizardState extends ConsumerState<ListingWizard> {
  static const _lastStep = 6;

  int _step = 0;
  bool _submitting = false;
  bool _uploading = false;

  // Answers, in the shape src/lib/listing-copy.ts ListingAnswers expects.
  String _intent = 'sale';
  String _type = 'House';
  String _city = 'Maputo';
  String _currency = 'MZN';
  final Map<String, String> _choices = {};
  final Set<String> _features = {};
  final List<_Photo> _photos = [];
  double? _lat;
  double? _lng;

  final _bairro = TextEditingController();
  final _price = TextEditingController();
  final Map<String, TextEditingController> _numbers = {};
  final _near = List.generate(3, (_) => TextEditingController());
  final _mapLink = TextEditingController();
  final _whatsapp = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();

  Map<String, dynamic>? _preview;
  String? _pinMessage;
  Timer? _debounce;

  String get _lang => context.locale.languageCode == 'en' ? 'en' : 'pt';

  TextEditingController _numberField(String key) => _numbers.putIfAbsent(key, () {
        final c = TextEditingController();
        c.addListener(_schedulePreview);
        return c;
      });

  @override
  void initState() {
    super.initState();
    final initial = widget.initial;
    if (initial != null) _restore(initial);
    for (final c in [_bairro, _price, ..._near]) {
      c.addListener(_schedulePreview);
    }
    WidgetsBinding.instance.addPostFrameCallback((_) => _refreshPreview());
  }

  @override
  void dispose() {
    _debounce?.cancel();
    for (final c in [_bairro, _price, ..._numbers.values, ..._near, _mapLink, _whatsapp, _phone, _email]) {
      c.dispose();
    }
    super.dispose();
  }

  void _restore(WizardSubmission from) {
    final a = from.answers;
    String text(Object? v) => v == null || v == 0 ? '' : '$v';
    _intent = a['listingType'] as String? ?? _intent;
    _type = a['propertyType'] as String? ?? _type;
    _city = a['city'] as String? ?? _city;
    _currency = a['currency'] as String? ?? _currency;
    _bairro.text = a['bairro'] as String? ?? '';
    _price.text = text(a['price']);
    for (final key in ['beds', 'baths', 'suites', 'storeys', 'parking', 'buildingSize', 'landSize', 'frontage', 'depth']) {
      _numberField(key).text = text(a[key]);
    }
    _numberField('floor').text = a['floor'] == null ? '' : '${a['floor']}';
    for (final key in ['condition', 'furnishing', 'zoning', 'duat', 'roadSurface', 'structures', 'commercialUse']) {
      final v = a[key];
      if (v is String && v.isNotEmpty) _choices[key] = v;
    }
    _features.addAll(((a['features'] as List?) ?? const []).cast<String>());
    final near = ((a['near'] as List?) ?? const []).cast<String>();
    for (var i = 0; i < near.length && i < 3; i++) {
      _near[i].text = near[i];
    }
    _lat = (a['lat'] as num?)?.toDouble();
    _lng = (a['lng'] as num?)?.toDouble();
    for (final url in from.imageUrls) {
      _photos.add(_Photo(url)..interior = from.interiorUrls.contains(url));
    }
    _whatsapp.text = from.contact['whatsapp'] ?? '';
    _phone.text = from.contact['phone'] ?? '';
    _email.text = from.contact['email'] ?? '';
    _step = _lastStep;
  }

  // ── Answers & preview ─────────────────────────────────────────────────────

  num _n(String key) => num.tryParse(_numberField(key).text.trim().replaceAll(',', '.')) ?? 0;

  Map<String, dynamic> _answers() {
    final floorText = _numberField('floor').text.trim();
    return {
      'listingType': _intent,
      'propertyType': _type,
      'city': _city,
      'bairro': _bairro.text.trim(),
      'price': num.tryParse(_price.text.replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0,
      'currency': _currency,
      'beds': _n('beds'),
      'baths': _n('baths'),
      'suites': _n('suites'),
      'storeys': _n('storeys'),
      'floor': floorText.isEmpty ? null : int.tryParse(floorText),
      'parking': _n('parking'),
      'buildingSize': _n('buildingSize'),
      'landSize': _n('landSize'),
      'frontage': _n('frontage'),
      'depth': _n('depth'),
      ..._choices,
      'features': _features.toList(),
      'near': _near.map((c) => c.text.trim()).toList(),
      'lat': _lat,
      'lng': _lng,
      'photos': _photos.length,
      'interior': _photos.where((p) => p.interior).length,
    };
  }

  void _schedulePreview() {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), _refreshPreview);
  }

  void _changed(VoidCallback update) {
    setState(update);
    _schedulePreview();
  }

  Future<void> _refreshPreview({String? mapLink}) async {
    try {
      final preview = await ref.read(agentDashboardRepositoryProvider).previewListing(_lang, _answers(), mapLink: mapLink);
      if (!mounted) return;
      setState(() => _preview = preview);
    } catch (_) {
      // The preview is advisory; the server re-checks everything on submit.
    }
  }

  List<String> get _blockers => ((_preview?['blockers'] as List?) ?? const []).cast<String>();

  // ── Map pin ───────────────────────────────────────────────────────────────

  Future<void> _setPin(Map<String, dynamic> text) async {
    final link = _mapLink.text.trim();
    if (link.isEmpty) return;
    final preview = await ref.read(agentDashboardRepositoryProvider).previewListing(_lang, _answers(), mapLink: link);
    if (!mounted) return;
    final pin = preview['pin'] as Map<String, dynamic>?;
    setState(() {
      _preview = preview;
      if (pin != null) {
        _lat = (pin['lat'] as num).toDouble();
        _lng = (pin['lng'] as num).toDouble();
        _pinMessage = pin['outsideMozambique'] == true ? text['outsideMozambique'] as String? : null;
      } else {
        _pinMessage = preview['pinError'] == 'short' ? text['shortLinkError'] as String? : text['noCoordsError'] as String?;
      }
    });
  }

  // ── Photos ────────────────────────────────────────────────────────────────

  Future<void> _addPhotos() async {
    final picker = ImagePicker();
    List<XFile> files;
    try {
      files = await picker.pickMultiImage(imageQuality: 75, maxWidth: 1600, maxHeight: 1600);
    } catch (_) {
      // Some older gallery apps reject the multi-select intent; retry single.
      try {
        final single = await picker.pickImage(source: ImageSource.gallery, imageQuality: 75, maxWidth: 1600, maxHeight: 1600);
        files = single == null ? [] : [single];
      } catch (e) {
        _snack('${'dashboard.imagePickerError'.tr()}\n($e)');
        return;
      }
    }
    if (files.isEmpty || !mounted) return;
    setState(() => _uploading = true);
    var failed = 0;
    Object? lastError;
    for (final file in files) {
      try {
        final bytes = await file.readAsBytes();
        final mime = file.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        final url = await ref.read(agentDashboardRepositoryProvider).uploadImage('data:$mime;base64,${base64Encode(bytes)}');
        if (!mounted) return;
        setState(() => _photos.add(_Photo(url)));
      } catch (e) {
        failed++;
        lastError = e;
      }
    }
    if (!mounted) return;
    setState(() => _uploading = false);
    _schedulePreview();
    if (failed > 0) {
      _snack('dashboard.imageUploadFailed'.tr(args: ['$failed', lastError.asApiException?.message ?? '$lastError']));
    }
  }

  void _snack(String message) {
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  void _go(int step) {
    setState(() => _step = step);
    if (widget.scrollController.hasClients) widget.scrollController.jumpTo(0);
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      await widget.onComplete(WizardSubmission(
        lang: _lang,
        answers: _answers(),
        imageUrls: _photos.map((p) => p.url).toList(),
        contact: {'whatsapp': _whatsapp.text.trim(), 'phone': _phone.text.trim(), 'email': _email.text.trim()},
        interiorUrls: {for (final p in _photos) if (p.interior) p.url},
      ));
    } catch (e) {
      _snack(e.asApiException?.message ?? 'common.somethingWentWrong'.tr());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final schema = ref.watch(listingWizardProvider(_lang));
    return schema.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(e.asApiException?.message ?? 'common.somethingWentWrong'.tr(), textAlign: TextAlign.center),
              const SizedBox(height: 12),
              OutlinedButton(onPressed: () => ref.invalidate(listingWizardProvider(_lang)), child: Text('common.retry'.tr())),
            ],
          ),
        ),
      ),
      data: _buildWizard,
    );
  }

  Widget _buildWizard(Map<String, dynamic> schema) {
    final text = (schema['text'] as Map).cast<String, dynamic>();
    final steps = (schema['steps'] as List).cast<String>();
    final category = ((schema['categories'] as Map)[_type] as Map).cast<String, dynamic>();
    String t(String key) => (text[key] as String?) ?? key;

    final body = switch (_step) {
      0 => _stepWhere(schema, t),
      1 => _stepNumbers(schema, category, t),
      2 => _stepDetails(category, t),
      3 => _stepFeatures(category, t),
      4 => _stepPlace(text, t),
      5 => _stepPhotos(category, t),
      _ => _stepContact(t),
    };

    return Column(
      children: [
        Expanded(
          child: ListView(
            controller: widget.scrollController,
            padding: EdgeInsets.fromLTRB(20, 12, 20, MediaQuery.of(context).viewInsets.bottom + 20),
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(color: AppColors.outlineVariant, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              Row(
                children: [
                  if (_step == 0 && widget.onExit != null)
                    IconButton(
                      onPressed: widget.onExit,
                      icon: const Icon(Icons.arrow_back),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    ),
                  Expanded(child: Text(t('heading'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
                  if (_preview != null) _QualityBadge(label: t('quality'), score: _preview!['score'] as num, band: _preview!['band'] as String),
                ],
              ),
              const SizedBox(height: 10),
              _StepProgress(steps: steps, current: _step),
              const SizedBox(height: 4),
              Text(
                'wizard.stepOf'.tr(args: ['${_step + 1}', '${steps.length}', steps[_step]]),
                style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 16),
              ...body,
            ],
          ),
        ),
        _footer(t),
      ],
    );
  }

  Widget _footer(String Function(String) t) {
    final isLast = _step == _lastStep;
    final blocked = isLast && _blockers.isNotEmpty;
    return Container(
      padding: EdgeInsets.fromLTRB(20, 10, 20, 12 + MediaQuery.of(context).padding.bottom),
      decoration: const BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        border: Border(top: BorderSide(color: AppColors.outlineVariant)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (isLast && _blockers.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(_blockers.first, style: const TextStyle(fontSize: 12.5, color: AppColors.error, fontWeight: FontWeight.w600)),
            ),
          Row(
            children: [
              if (_step > 0) ...[
                Expanded(
                  child: OutlinedButton(
                    onPressed: _submitting ? null : () => _go(_step - 1),
                    child: Text(t('back')),
                  ),
                ),
                const SizedBox(width: 12),
              ],
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: _submitting || _uploading || blocked ? null : (isLast ? _submit : () => _go(_step + 1)),
                  child: _submitting
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(isLast ? widget.submitLabel : t('continue')),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Steps ─────────────────────────────────────────────────────────────────

  List<Widget> _stepWhere(Map<String, dynamic> schema, String Function(String) t) {
    final intents = (schema['intents'] as List).cast<Map>();
    final types = (schema['propertyTypes'] as List).cast<Map>();
    final cities = (schema['cities'] as List).cast<String>();
    return [
      _Question(title: t('whereQ'), why: t('whereWhy')),
      _Label(t('listingType')),
      _ChoiceWrap(
        options: [for (final i in intents) (i['value'] as String, i['label'] as String)],
        selected: _intent,
        onSelected: (v) => _changed(() => _intent = v),
      ),
      _Label(t('propertyType')),
      _ChoiceWrap(
        options: [for (final ty in types) (ty['value'] as String, ty['label'] as String)],
        selected: _type,
        onSelected: (v) => _changed(() => _type = v),
      ),
      _Label(t('city')),
      DropdownButtonFormField<String>(
        initialValue: _city,
        items: [for (final c in cities) DropdownMenuItem(value: c, child: Text(c))],
        onChanged: (v) => _changed(() => _city = v ?? _city),
      ),
      _Label(t('bairro')),
      TextField(controller: _bairro, decoration: InputDecoration(hintText: t('bairroPlaceholder'))),
    ];
  }

  List<Widget> _stepNumbers(Map<String, dynamic> schema, Map<String, dynamic> category, String Function(String) t) {
    final labels = (schema['numLabels'] as Map).cast<String, dynamic>();
    final fields = (category['numericFields'] as List).cast<String>();
    return [
      _Question(title: t('numbersQ'), why: t('numbersWhy')),
      Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            flex: 3,
            child: TextField(
              controller: _price,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
              decoration: InputDecoration(labelText: t('price')),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: DropdownButtonFormField<String>(
              initialValue: _currency,
              decoration: InputDecoration(labelText: t('currency')),
              items: const [
                DropdownMenuItem(value: 'MZN', child: Text('MZN')),
                DropdownMenuItem(value: 'USD', child: Text('USD')),
              ],
              onChanged: (v) => _changed(() => _currency = v ?? _currency),
            ),
          ),
        ],
      ),
      Padding(
        padding: const EdgeInsets.only(top: 6),
        child: Text(t('priceNote'), style: const TextStyle(fontSize: 11.5, color: AppColors.onSurfaceVariant)),
      ),
      const SizedBox(height: 8),
      for (final f in fields)
        Padding(
          padding: const EdgeInsets.only(top: 12),
          child: TextField(
            controller: _numberField(f),
            keyboardType: TextInputType.numberWithOptions(signed: f == 'floor', decimal: f.contains('Size')),
            decoration: InputDecoration(
              labelText: labels[f] as String? ?? f,
              helperText: labels['${f}Hint'] as String?,
              helperMaxLines: 3,
            ),
          ),
        ),
    ];
  }

  List<Widget> _stepDetails(Map<String, dynamic> category, String Function(String) t) {
    final built = category['built'] == true;
    final questions = (category['questions'] as List).cast<Map>();
    return [
      _Question(title: built ? t('buildingQ') : t('plotQ'), why: built ? t('buildingWhy') : t('plotWhy')),
      for (final q in questions) ...[
        _Label(q['label'] as String),
        _ChoiceWrap(
          options: [for (final c in (q['choices'] as List).cast<Map>()) (c['value'] as String, c['label'] as String)],
          selected: _choices[q['key']] ?? '',
          onSelected: (v) => _changed(() => _choices[q['key'] as String] = v),
        ),
      ],
    ];
  }

  List<Widget> _stepFeatures(Map<String, dynamic> category, String Function(String) t) {
    final built = category['built'] == true;
    final groups = (category['featureGroups'] as List).cast<Map>();
    return [
      _Question(title: built ? t('featuresBuiltQ') : t('featuresLandQ'), why: t('featuresWhy')),
      for (final g in groups) ...[
        _Label(g['label'] as String),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final item in (g['items'] as List).cast<Map>())
              FilterChip(
                label: Text(item['label'] as String),
                selected: _features.contains(item['value']),
                onSelected: (on) => _changed(() => on ? _features.add(item['value'] as String) : _features.remove(item['value'])),
              ),
          ],
        ),
      ],
    ];
  }

  List<Widget> _stepPlace(Map<String, dynamic> text, String Function(String) t) {
    return [
      _Question(title: t('nearQ'), why: t('nearWhy')),
      for (var i = 0; i < 3; i++)
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: TextField(
            controller: _near[i],
            decoration: InputDecoration(labelText: 'wizard.landmark'.tr(args: ['${i + 1}']), hintText: t('landmarkPlaceholder')),
          ),
        ),
      const SizedBox(height: 12),
      _Question(title: t('mapQ'), why: t('mapWhy')),
      TextField(
        controller: _mapLink,
        decoration: InputDecoration(
          labelText: t('pasteLink'),
          hintText: t('pastePlaceholder'),
          helperText: t('pasteHint'),
          helperMaxLines: 3,
          suffixIcon: IconButton(icon: const Icon(Icons.push_pin_outlined), onPressed: () => _setPin(text)),
        ),
        onSubmitted: (_) => _setPin(text),
      ),
      const SizedBox(height: 12),
      if (_lat != null && _lng != null)
        Row(
          children: [
            const Icon(Icons.location_on, color: AppColors.primary, size: 18),
            const SizedBox(width: 6),
            Expanded(child: Text('${t('pinSet')} ${_lat!.toStringAsFixed(6)}, ${_lng!.toStringAsFixed(6)}')),
            TextButton(
              onPressed: () => _changed(() {
                _lat = null;
                _lng = null;
                _pinMessage = null;
                _mapLink.clear();
              }),
              child: Text(t('clear')),
            ),
          ],
        )
      else
        Text(t('noPin'), style: const TextStyle(fontSize: 12.5, color: AppColors.onSurfaceVariant)),
      if (_pinMessage != null)
        Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Text(_pinMessage!.trim().replaceFirst(RegExp(r'^—\s*'), ''), style: const TextStyle(fontSize: 12.5, color: AppColors.error)),
        ),
    ];
  }

  List<Widget> _stepPhotos(Map<String, dynamic> category, String Function(String) t) {
    final needsInterior = category['requiresInterior'] == true;
    final interior = _photos.where((p) => p.interior).length;
    final enough = _photos.length >= 6;
    return [
      _Question(title: t('photosQ'), why: t('photosWhy')),
      OutlinedButton.icon(
        onPressed: _uploading ? null : _addPhotos,
        icon: _uploading
            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
            : const Icon(Icons.add_photo_alternate_outlined),
        label: Text(t('addPhotos')),
      ),
      const SizedBox(height: 12),
      _StatusLine(ok: enough, text: enough ? 'wizard.photosEnough'.tr(args: ['${_photos.length}']) : 'wizard.photosShort'.tr(args: ['${_photos.length}'])),
      if (needsInterior)
        _StatusLine(ok: interior >= 2, text: interior >= 2 ? 'wizard.interiorEnough'.tr(args: ['$interior']) : t('interiorShort')),
      const SizedBox(height: 12),
      if (_photos.isNotEmpty)
        GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          children: [
            for (final photo in _photos)
              _PhotoTile(
                photo: photo,
                interiorLabel: t('interior'),
                showInterior: needsInterior,
                onToggleInterior: () => _changed(() => photo.interior = !photo.interior),
                onRemove: () => _changed(() => _photos.remove(photo)),
              ),
          ],
        ),
    ];
  }

  List<Widget> _stepContact(String Function(String) t) {
    final title = _preview?['title'] as String?;
    final description = _preview?['description'] as String?;
    return [
      _Question(title: t('contactQ'), why: t('contactWhy')),
      TextField(
        controller: _whatsapp,
        keyboardType: TextInputType.phone,
        decoration: InputDecoration(labelText: t('whatsappNumber'), prefixIcon: const Icon(Icons.chat_outlined), hintText: '+258 84 123 4567'),
      ),
      const SizedBox(height: 10),
      TextField(
        controller: _phone,
        keyboardType: TextInputType.phone,
        decoration: InputDecoration(labelText: t('phoneNumber'), prefixIcon: const Icon(Icons.phone_outlined), hintText: '+258 84 123 4567'),
      ),
      const SizedBox(height: 10),
      TextField(
        controller: _email,
        keyboardType: TextInputType.emailAddress,
        decoration: InputDecoration(labelText: t('emailLabel'), prefixIcon: const Icon(Icons.email_outlined), hintText: t('emailPlaceholder')),
      ),
      const SizedBox(height: 8),
      Text(t('contactFallback'), style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
      if (title != null) ...[
        const SizedBox(height: 24),
        Text(t('previewTitle'), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
        const SizedBox(height: 4),
        Text(t('generatedNote'), style: const TextStyle(fontSize: 11.5, color: AppColors.onSurfaceVariant)),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surfaceContainer,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              if (description != null && description.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(description, style: const TextStyle(fontSize: 13, height: 1.45)),
              ],
            ],
          ),
        ),
      ],
    ];
  }
}

// ── Small pieces ────────────────────────────────────────────────────────────

class _Question extends StatelessWidget {
  final String title;
  final String why;
  const _Question({required this.title, required this.why});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text(why, style: const TextStyle(fontSize: 12.5, color: AppColors.onSurfaceVariant, height: 1.35)),
        ],
      ),
    );
  }
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 14, bottom: 8),
      child: Text(text, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5)),
    );
  }
}

class _ChoiceWrap extends StatelessWidget {
  final List<(String value, String label)> options;
  final String selected;
  final ValueChanged<String> onSelected;
  const _ChoiceWrap({required this.options, required this.selected, required this.onSelected});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final (value, label) in options)
          ChoiceChip(
            label: Text(label),
            selected: selected == value,
            onSelected: (_) => onSelected(value),
          ),
      ],
    );
  }
}

class _StepProgress extends StatelessWidget {
  final List<String> steps;
  final int current;
  const _StepProgress({required this.steps, required this.current});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (var i = 0; i < steps.length; i++)
          Expanded(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              height: 4,
              margin: EdgeInsets.only(right: i == steps.length - 1 ? 0 : 4),
              decoration: BoxDecoration(
                color: i <= current ? AppColors.primary : AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
      ],
    );
  }
}

class _QualityBadge extends StatelessWidget {
  final String label;
  final num score;
  final String band;
  const _QualityBadge({required this.label, required this.score, required this.band});

  @override
  Widget build(BuildContext context) {
    final color = switch (band) {
      'good' => const Color(0xFF1E7B4A),
      'warn' => const Color(0xFFB7791F),
      _ => AppColors.error,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
      child: Text('$label ${score.round()}', style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 12)),
    );
  }
}

class _StatusLine extends StatelessWidget {
  final bool ok;
  final String text;
  const _StatusLine({required this.ok, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(ok ? Icons.check_circle : Icons.info_outline, size: 16, color: ok ? const Color(0xFF1E7B4A) : AppColors.onSurfaceVariant),
          const SizedBox(width: 6),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 12.5))),
        ],
      ),
    );
  }
}

class _PhotoTile extends StatelessWidget {
  final _Photo photo;
  final String interiorLabel;
  final bool showInterior;
  final VoidCallback onToggleInterior;
  final VoidCallback onRemove;
  const _PhotoTile({
    required this.photo,
    required this.interiorLabel,
    required this.showInterior,
    required this.onToggleInterior,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: Stack(
        fit: StackFit.expand,
        children: [
          CachedNetworkImage(imageUrl: photo.url, fit: BoxFit.cover),
          Positioned(
            top: 4,
            right: 4,
            child: GestureDetector(
              onTap: onRemove,
              child: const CircleAvatar(radius: 12, backgroundColor: Colors.black54, child: Icon(Icons.close, size: 14, color: Colors.white)),
            ),
          ),
          if (showInterior)
            Positioned(
              left: 4,
              right: 4,
              bottom: 4,
              child: GestureDetector(
                onTap: onToggleInterior,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  decoration: BoxDecoration(
                    color: photo.interior ? AppColors.primary : Colors.black54,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(photo.interior ? Icons.check : Icons.weekend_outlined, size: 13, color: Colors.white),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          interiorLabel,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
