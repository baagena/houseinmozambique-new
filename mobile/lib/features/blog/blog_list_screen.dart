import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../repositories/blog_repository.dart';
import '../../widgets/error_view.dart';
import '../../widgets/shimmer_loaders.dart';

final blogListProvider = FutureProvider.autoDispose((ref) => ref.watch(blogRepositoryProvider).getAll());

class BlogListScreen extends ConsumerWidget {
  const BlogListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final postsAsync = ref.watch(blogListProvider);

    return Scaffold(
      appBar: AppBar(title: Text('blog.title'.tr())),
      body: postsAsync.when(
        loading: () => const ListSkeleton(),
        error: (err, st) => ErrorView(
          message: err is ApiException ? err.message : null,
          onRetry: () => ref.invalidate(blogListProvider),
        ),
        data: (posts) => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: posts.length,
          separatorBuilder: (_, __) => const SizedBox(height: 16),
          itemBuilder: (context, index) {
            final post = posts[index];
            return GestureDetector(
              onTap: () => context.push('/blog/${post.slug}'),
              child: Card(
                clipBehavior: Clip.antiAlias,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (post.coverImage != null)
                      AspectRatio(
                        aspectRatio: 16 / 9,
                        child: CachedNetworkImage(imageUrl: post.coverImage!, fit: BoxFit.cover),
                      ),
                    Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(post.category, style: const TextStyle(color: AppColors.secondary, fontSize: 12, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 4),
                          Text(post.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text(post.excerpt, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.onSurfaceVariant)),
                          const SizedBox(height: 8),
                          Text('blog.readTime'.tr(args: ['${post.readTime}']), style: const TextStyle(fontSize: 12, color: AppColors.outline)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
