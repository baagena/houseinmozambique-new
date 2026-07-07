import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../repositories/admin_repository.dart';
import '../../widgets/error_view.dart';
import '../../widgets/shimmer_loaders.dart';
import 'admin_blog_form_screen.dart';

class AdminBlogScreen extends ConsumerWidget {
  const AdminBlogScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final postsAsync = ref.watch(adminBlogPostsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Blog'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () async {
              final created = await Navigator.of(context).push<bool>(
                MaterialPageRoute(builder: (_) => const AdminBlogFormScreen()),
              );
              if (created == true) ref.invalidate(adminBlogPostsProvider);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(adminBlogPostsProvider.future),
        child: postsAsync.when(
          loading: () => const ListSkeleton(),
          error: (err, st) => ErrorView(
            message: err.asApiException?.message,
            onRetry: () => ref.invalidate(adminBlogPostsProvider),
          ),
          data: (posts) {
            if (posts.isEmpty) {
              return const EmptyView(icon: Icons.article_outlined, title: 'No articles yet');
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: posts.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final post = posts[i];
                return Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    title: Text(post.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text(post.category),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: (post.status == 'PUBLISHED' ? Colors.green : AppColors.secondary).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            post.status,
                            style: TextStyle(color: post.status == 'PUBLISHED' ? Colors.green : AppColors.secondary, fontSize: 10, fontWeight: FontWeight.w600),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline),
                          onPressed: () async {
                            await ref.read(adminRepositoryProvider).deleteBlogPost(post.id);
                            ref.invalidate(adminBlogPostsProvider);
                          },
                        ),
                      ],
                    ),
                    onTap: () async {
                      final changed = await Navigator.of(context).push<bool>(
                        MaterialPageRoute(builder: (_) => AdminBlogFormScreen(post: post)),
                      );
                      if (changed == true) ref.invalidate(adminBlogPostsProvider);
                    },
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
