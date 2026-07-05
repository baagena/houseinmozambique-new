class Agent {
  final String id;
  final String name;
  final String initials;
  final String title;
  final String location;
  final String? phone;
  final String? email;
  final double rating;
  final int reviewCount;
  final bool isFeatured;
  final bool isVerified;
  final String? avatar;
  final String? bio;
  final int? yearsExperience;
  final List<String> specializations;
  final int propertyCount;

  Agent({
    required this.id,
    required this.name,
    required this.initials,
    required this.title,
    required this.location,
    this.phone,
    this.email,
    this.rating = 0,
    this.reviewCount = 0,
    this.isFeatured = false,
    this.isVerified = false,
    this.avatar,
    this.bio,
    this.yearsExperience,
    this.specializations = const [],
    this.propertyCount = 0,
  });

  factory Agent.fromJson(Map<String, dynamic> json) {
    return Agent(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      initials: json['initials'] as String? ?? '',
      title: json['title'] as String? ?? '',
      location: json['location'] as String? ?? '',
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      reviewCount: json['reviewCount'] as int? ?? 0,
      isFeatured: json['isFeatured'] as bool? ?? false,
      isVerified: json['isVerified'] as bool? ?? false,
      avatar: json['avatar'] as String?,
      bio: json['bio'] as String?,
      yearsExperience: json['yearsExperience'] as int?,
      specializations: (json['specializations'] as List?)?.map((e) => e.toString()).toList() ?? [],
      propertyCount: (json['_count'] as Map<String, dynamic>?)?['properties'] as int? ?? 0,
    );
  }
}
