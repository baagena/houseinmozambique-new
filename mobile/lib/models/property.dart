import 'agent.dart';

class Property {
  final String id;
  final String title;
  final String description;
  final String location;
  final String city;
  final String? neighborhood;
  final String? address;
  final double price;
  final String priceUnit; // sale, monthly, nightly
  final String type; // Villa, Apartment, ...
  final String listingType; // Buy, Rent, Short Stay
  final int bedrooms;
  final int bathrooms;
  final double area;
  final double rating;
  final int reviewCount;
  final bool isFeatured;
  final bool isNew;
  final bool isPremium;
  final List<String> amenities;
  final List<String> images;
  final List<String> tags;
  final String hostId;
  final Agent? host;
  final String status;
  final DateTime createdAt;

  Property({
    required this.id,
    required this.title,
    required this.description,
    required this.location,
    required this.city,
    this.neighborhood,
    this.address,
    required this.price,
    required this.priceUnit,
    required this.type,
    required this.listingType,
    required this.bedrooms,
    required this.bathrooms,
    required this.area,
    this.rating = 0,
    this.reviewCount = 0,
    this.isFeatured = false,
    this.isNew = false,
    this.isPremium = false,
    this.amenities = const [],
    this.images = const [],
    this.tags = const [],
    required this.hostId,
    this.host,
    required this.status,
    required this.createdAt,
  });

  String get coverImage => images.isNotEmpty ? images.first : '';

  /// e.g. "1,800 MT/month", "85,000 MT", "180 MT/night"
  String priceLabel(String currencySymbol) {
    final formatted = _formatNumber(price);
    switch (priceUnit) {
      case 'monthly':
        return '$currencySymbol$formatted/mo';
      case 'nightly':
        return '$currencySymbol$formatted/night';
      default:
        return '$currencySymbol$formatted';
    }
  }

  static String _formatNumber(double value) {
    final s = value.toInt().toString();
    final buffer = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buffer.write(',');
      buffer.write(s[i]);
    }
    return buffer.toString();
  }

  factory Property.fromJson(Map<String, dynamic> json) {
    return Property(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      location: json['location'] as String? ?? '',
      city: json['city'] as String? ?? '',
      neighborhood: json['neighborhood'] as String?,
      address: json['address'] as String?,
      price: (json['price'] as num?)?.toDouble() ?? 0,
      priceUnit: json['priceUnit'] as String? ?? 'sale',
      type: json['type'] as String? ?? '',
      listingType: json['listingType'] as String? ?? '',
      bedrooms: json['bedrooms'] as int? ?? 0,
      bathrooms: json['bathrooms'] as int? ?? 0,
      area: (json['area'] as num?)?.toDouble() ?? 0,
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      reviewCount: json['reviewCount'] as int? ?? 0,
      isFeatured: json['isFeatured'] as bool? ?? false,
      isNew: json['isNew'] as bool? ?? false,
      isPremium: json['isPremium'] as bool? ?? false,
      amenities: (json['amenities'] as List?)?.map((e) => e.toString()).toList() ?? [],
      images: (json['images'] as List?)?.map((e) => e.toString()).toList() ?? [],
      tags: (json['tags'] as List?)?.map((e) => e.toString()).toList() ?? [],
      hostId: json['hostId'] as String? ?? '',
      host: json['host'] != null ? Agent.fromJson(json['host'] as Map<String, dynamic>) : null,
      status: json['status'] as String? ?? 'PENDING',
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
    );
  }
}
