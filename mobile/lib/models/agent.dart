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
  final String role;

  // Public contact channels (shown on the profile; every press is recorded).
  final String? whatsapp;
  final String? officeAddress;

  /// Full https links keyed by network: facebook, instagram, linkedin,
  /// tiktok, youtube, x.
  final Map<String, String> socialLinks;

  // Corporate agencies: companies that market their services (often to
  // businesses and government) rather than posting listings.
  final String? agencyName;
  final String? agencyPhone;
  final String? agencyBusinessType;
  final String? agencyAbout;
  final List<String> agencyServices;
  final List<String> agencyAreasServed;
  final String? agencyWebsite;
  final String? agencyEmail;

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
    this.role = 'AGENT',
    this.whatsapp,
    this.officeAddress,
    this.socialLinks = const {},
    this.agencyName,
    this.agencyPhone,
    this.agencyBusinessType,
    this.agencyAbout,
    this.agencyServices = const [],
    this.agencyAreasServed = const [],
    this.agencyWebsite,
    this.agencyEmail,
  });

  bool get isAdmin => role == 'ADMIN';
  bool get isCustomer => role == 'CUSTOMER';
  /// Accounts that list property: agents, admins, and private owners (OWNER —
  /// someone listing their own home). Owners were missing here, so after
  /// signing in they were treated as customers and asked to register again.
  bool get isAgent => role == 'AGENT' || role == 'ADMIN' || role == 'OWNER';

  bool get isOwner => role == 'OWNER';

  /// Same rule as the website: an agency name makes it a corporate profile.
  bool get isCorporate => agencyName != null && agencyName!.trim().isNotEmpty;

  /// The name visitors see: the company for agencies, the person otherwise.
  String get displayName => isCorporate ? agencyName!.trim() : name;

  /// Number to ring: the agency line first for companies.
  String? get contactPhone => _clean(isCorporate ? (agencyPhone ?? phone) : phone) ?? _clean(phone);

  /// WhatsApp: a dedicated number wins; otherwise the phone is assumed to be on it.
  String? get contactWhatsapp => _clean(whatsapp) ?? contactPhone;

  /// Public email: only agencies publish one (people get the message form).
  String? get contactEmail => _clean(agencyEmail);

  String? get website => _clean(agencyWebsite);

  /// What the profile says about them: the agency text for companies.
  String? get about => isCorporate ? (_clean(agencyAbout) ?? _clean(bio)) : _clean(bio);

  /// Services for companies, specialities for people.
  List<String> get expertise => isCorporate && agencyServices.isNotEmpty ? agencyServices : specializations;

  static String? _clean(String? v) => (v == null || v.trim().isEmpty) ? null : v.trim();

  static List<String> _strings(Object? v) => (v as List?)?.map((e) => e.toString()).toList() ?? const [];

  factory Agent.fromJson(Map<String, dynamic> json) {
    final socials = <String, String>{};
    final rawSocials = json['socialLinks'];
    if (rawSocials is Map) {
      rawSocials.forEach((k, v) {
        if (v is String && v.startsWith('https://')) socials[k.toString()] = v;
      });
    }
    return Agent(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      initials: json['initials'] as String? ?? '',
      title: json['title'] as String? ?? '',
      location: json['location'] as String? ?? '',
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      reviewCount: (json['reviewCount'] as num?)?.toInt() ?? 0,
      isFeatured: json['isFeatured'] as bool? ?? false,
      isVerified: json['isVerified'] as bool? ?? false,
      avatar: json['avatar'] as String?,
      bio: json['bio'] as String?,
      yearsExperience: (json['yearsExperience'] as num?)?.toInt(),
      specializations: _strings(json['specializations']),
      propertyCount: ((json['_count'] as Map<String, dynamic>?)?['properties'] as num?)?.toInt() ?? 0,
      role: json['role'] as String? ?? 'AGENT',
      whatsapp: json['whatsapp'] as String?,
      officeAddress: json['officeAddress'] as String?,
      socialLinks: socials,
      agencyName: json['agencyName'] as String?,
      agencyPhone: json['agencyPhone'] as String?,
      agencyBusinessType: json['agencyBusinessType'] as String?,
      agencyAbout: json['agencyAbout'] as String?,
      agencyServices: _strings(json['agencyServices']),
      agencyAreasServed: _strings(json['agencyAreasServed']),
      agencyWebsite: json['agencyWebsite'] as String?,
      agencyEmail: json['agencyEmail'] as String?,
    );
  }
}
