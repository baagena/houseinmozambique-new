import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/json.dart';
import '../../repositories/admin_repository.dart';
import '../../widgets/dashboard_ui.dart';
import '../../widgets/error_view.dart';
import '../../widgets/shimmer_loaders.dart';

/// "Edit pages": the website's text, key by key — web: dashboard/admin/content.
/// Saving an empty value (or the default) restores the built-in text.
class AdminContentScreen extends ConsumerStatefulWidget {
  const AdminContentScreen({super.key});

  @override
  ConsumerState<AdminContentScreen> createState() => _AdminContentScreenState();
}

class _AdminContentScreenState extends ConsumerState<AdminContentScreen> {
  String _lang = 'pt';
  String _query = '';
  bool _onlyEdited = false;

  Future<void> _edit(String key, String current, String fallback) async {
    final value = await promptText(
      context,
      title: key,
      label: _lang.toUpperCase(),
      initial: current,
      maxLines: 8,
    );
    if (value == null || !mounted) return;
    if (await runAction(
      context,
      () => ref.read(adminRepositoryProvider).saveContent([
        {'key': key, 'lang': _lang, 'value': value},
      ]),
      success: value.isEmpty || value == fallback ? 'dash.textReset'.tr() : 'admin.settingsUpdated'.tr(),
    )) {
      ref.invalidate(adminContentProvider);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(adminContentProvider);
    return Scaffold(
      appBar: AppBar(title: Text('dash.editPages'.tr())),
      body: async.when(
        loading: () => const ListSkeleton(),
        error: (e, _) => ErrorView(message: e.asApiException?.message, onRetry: () => ref.invalidate(adminContentProvider)),
        data: (data) {
          final defaults = data.obj('defaults').obj(_lang);
          final overrides = data.obj('overrides').obj(_lang);
          final q = _query.toLowerCase();
          final keys = defaults.keys.where((k) {
            if (_onlyEdited && !overrides.containsKey(k)) return false;
            if (q.isEmpty) return true;
            final value = overrides.str(k, defaults.str(k));
            return k.toLowerCase().contains(q) || value.toLowerCase().contains(q);
          }).toList()
            ..sort();
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                child: TextField(
                  decoration: InputDecoration(prefixIcon: const Icon(Icons.search), hintText: 'common.search'.tr()),
                  onChanged: (v) => setState(() => _query = v.trim()),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Wrap(spacing: 8, runSpacing: 4, children: [
                  ChoiceChip(label: const Text('PT'), selected: _lang == 'pt', onSelected: (_) => setState(() => _lang = 'pt')),
                  ChoiceChip(label: const Text('EN'), selected: _lang == 'en', onSelected: (_) => setState(() => _lang = 'en')),
                  FilterChip(
                    label: Text('dash.editedOnly'.tr(args: ['${overrides.length}'])),
                    selected: _onlyEdited,
                    onSelected: (v) => setState(() => _onlyEdited = v),
                  ),
                ]),
              ),
              Expanded(
                child: keys.isEmpty
                    ? EmptyView(icon: Icons.search_off, title: 'common.noResults'.tr())
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                        itemCount: keys.length,
                        itemBuilder: (context, i) {
                          final k = keys[i];
                          final edited = overrides.containsKey(k);
                          final value = overrides.str(k, defaults.str(k));
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              title: Text(k, style: const TextStyle(fontSize: 11.5, color: AppColors.outline)),
                              subtitle: Text(value, maxLines: 3, overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 13.5, color: AppColors.onSurface)),
                              trailing: edited ? const Icon(Icons.edit, size: 16, color: AppColors.secondary) : null,
                              onTap: () => _edit(k, value, defaults.str(k)),
                            ),
                          );
                        },
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}
