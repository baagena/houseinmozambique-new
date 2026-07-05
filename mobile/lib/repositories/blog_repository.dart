import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../models/blog_post.dart';

class BlogRepository {
  final ApiClient _client;
  BlogRepository(this._client);

  Future<List<BlogPost>> getAll() async {
    final res = await _client.dio.get('/blog');
    final data = res.data as Map<String, dynamic>;
    return (data['posts'] as List).map((e) => BlogPost.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<(BlogPost, List<BlogPost>)> getBySlug(String slug) async {
    final res = await _client.dio.get('/blog/$slug');
    final data = res.data as Map<String, dynamic>;
    final post = BlogPost.fromJson(data['post'] as Map<String, dynamic>);
    final related =
        (data['related'] as List).map((e) => BlogPost.fromJson(e as Map<String, dynamic>)).toList();
    return (post, related);
  }
}

final blogRepositoryProvider = Provider<BlogRepository>((ref) => BlogRepository(ref.watch(apiClientProvider)));
