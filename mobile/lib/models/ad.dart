class Ad {
  final String id;
  final String title;
  final String? description;
  final String? imageUrl;
  final String? linkUrl;
  final String? linkText;
  final String position;
  final String type;
  final String bgColor;
  final String textColor;
  final String accentColor;

  Ad({
    required this.id,
    required this.title,
    this.description,
    this.imageUrl,
    this.linkUrl,
    this.linkText,
    required this.position,
    this.type = 'banner',
    this.bgColor = '#1a3c5e',
    this.textColor = '#ffffff',
    this.accentColor = '#f4a61d',
  });

  factory Ad.fromJson(Map<String, dynamic> json) {
    return Ad(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String?,
      linkUrl: json['linkUrl'] as String?,
      linkText: json['linkText'] as String?,
      position: json['position'] as String? ?? '',
      type: json['type'] as String? ?? 'banner',
      bgColor: json['bgColor'] as String? ?? '#1a3c5e',
      textColor: json['textColor'] as String? ?? '#ffffff',
      accentColor: json['accentColor'] as String? ?? '#f4a61d',
    );
  }
}
