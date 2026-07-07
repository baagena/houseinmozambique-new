import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../models/blog_post.dart';
import '../../repositories/blog_repository.dart';
import '../../widgets/error_view.dart';

final blogDetailProvider =
    FutureProvider.autoDispose.family<(BlogPost, List<BlogPost>), String>((ref, slug) {
  return ref.watch(blogRepositoryProvider).getBySlug(slug);
});

class BlogDetailScreen extends ConsumerWidget {
  final String slug;
  const BlogDetailScreen({super.key, required this.slug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(blogDetailProvider(slug));

    return Scaffold(
      appBar: AppBar(),
      body: detailAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, st) => ErrorView(
          message: err.asApiException?.message,
          onRetry: () => ref.invalidate(blogDetailProvider(slug)),
        ),
        data: (result) {
          final (post, related) = result;
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              if (post.coverImage != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: CachedNetworkImage(imageUrl: post.coverImage!, height: 200, width: double.infinity, fit: BoxFit.cover),
                ),
              const SizedBox(height: 16),
              Text(post.category, style: const TextStyle(color: AppColors.secondary, fontWeight: FontWeight.w600)),
              const SizedBox(height: 4),
              Text(post.title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(
                [if (post.authorName != null) post.authorName!, 'blog.readTime'.tr(args: ['${post.readTime}'])].join(' · '),
                style: const TextStyle(color: AppColors.onSurfaceVariant),
              ),
              const SizedBox(height: 20),
              for (final paragraph in post.content.split('\n').where((p) => p.trim().isNotEmpty))
                Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: Text(paragraph, style: const TextStyle(fontSize: 15, height: 1.6)),
                ),
              if (related.isNotEmpty) ...[
                const Divider(height: 32),
                Text('blog.title'.tr(), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                for (final r in related)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: r.coverImage != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: CachedNetworkImage(imageUrl: r.coverImage!, width: 56, height: 56, fit: BoxFit.cover),
                          )
                        : null,
                    title: Text(r.title, maxLines: 2, overflow: TextOverflow.ellipsis),
                    onTap: () => context.pushReplacement('/blog/${r.slug}'),
                  ),
              ],
            ],
          );
        },
      ),
    );
  }
}
