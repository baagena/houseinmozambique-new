class BlogPost {
  final String id;
  final String title;
  final String slug;
  final String excerpt;
  final String content;
  final String? coverImage;
  final String category;
  final List<String> tags;
  final bool isFeatured;
  final int readTime;
  final DateTime? publishedAt;
  final String? authorName;

  BlogPost({
    required this.id,
    required this.title,
    required this.slug,
    required this.excerpt,
    required this.content,
    this.coverImage,
    required this.category,
    this.tags = const [],
    this.isFeatured = false,
    this.readTime = 4,
    this.publishedAt,
    this.authorName,
  });

  factory BlogPost.fromJson(Map<String, dynamic> json) {
    final author = json['author'] as Map<String, dynamic>?;
    return BlogPost(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      excerpt: json['excerpt'] as String? ?? '',
      content: json['content'] as String? ?? '',
      coverImage: json['coverImage'] as String?,
      category: json['category'] as String? ?? '',
      tags: (json['tags'] as List?)?.map((e) => e.toString()).toList() ?? [],
      isFeatured: json['isFeatured'] as bool? ?? false,
      readTime: json['readTime'] as int? ?? 4,
      publishedAt: json['publishedAt'] != null ? DateTime.tryParse(json['publishedAt'] as String) : null,
      authorName: author?['name'] as String?,
    );
  }
}
