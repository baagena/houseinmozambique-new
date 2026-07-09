import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../repositories/admin_repository.dart';
import '../../widgets/error_view.dart';
import '../../widgets/shimmer_loaders.dart';
import '../../widgets/status_badge.dart';
import 'admin_property_form_screen.dart';

class AdminPropertiesScreen extends ConsumerStatefulWidget {
  const AdminPropertiesScreen({super.key});

  @override
  ConsumerState<AdminPropertiesScreen> createState() => _AdminPropertiesScreenState();
}

class _AdminPropertiesScreenState extends ConsumerState<AdminPropertiesScreen> {
  String? _filter;

  @override
  Widget build(BuildContext context) {
    final propertiesAsync = ref.watch(adminAllPropertiesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Properties')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: FilterPills(
              options: const [('All', null), ('Pending', 'PENDING'), ('Published', 'PUBLISHED'), ('Rejected', 'REJECTED')],
              selected: _filter,
              onSelected: (v) => setState(() => _filter = v),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => ref.refresh(adminAllPropertiesProvider.future),
              child: propertiesAsync.when(
                loading: () => const ListSkeleton(),
                error: (err, st) => ErrorView(
                  message: err.asApiException?.message,
                  onRetry: () => ref.invalidate(adminAllPropertiesProvider),
                ),
                data: (properties) {
                  final filtered = _filter == null ? properties : properties.where((p) => p.status == _filter).toList();
                  if (filtered.isEmpty) {
                    return const EmptyView(icon: Icons.home_work_outlined, title: 'No properties found');
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, i) {
                      final p = filtered[i];
                      return Card(
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          leading: ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: p.coverImage.isNotEmpty
                                ? CachedNetworkImage(imageUrl: p.coverImage, width: 52, height: 52, fit: BoxFit.cover)
                                : Container(width: 52, height: 52, color: AppColors.surfaceVariant),
                          ),
                          title: Text(p.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: Text('${p.host?.name ?? 'Unknown'} · ${p.city}'),
                          trailing: StatusBadge(status: p.status),
                          onTap: () async {
                            final changed = await Navigator.of(context).push<bool>(
                              MaterialPageRoute(builder: (_) => AdminPropertyFormScreen(property: p)),
                            );
                            if (changed == true) ref.invalidate(adminAllPropertiesProvider);
                          },
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
