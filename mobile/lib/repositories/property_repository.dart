import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../models/property.dart';

class PropertyFilters {
  final String? listingType;
  final String? city;
  final List<String>? propertyType;
  final double? minPrice;
  final double? maxPrice;
  final int? bedrooms;
  final int? bathrooms;
  final String? sort;
  final int page;
  final int limit;

  const PropertyFilters({
    this.listingType,
    this.city,
    this.propertyType,
    this.minPrice,
    this.maxPrice,
    this.bedrooms,
    this.bathrooms,
    this.sort,
    this.page = 1,
    this.limit = 20,
  });

  PropertyFilters copyWith({
    String? listingType,
    String? city,
    List<String>? propertyType,
    double? minPrice,
    double? maxPrice,
    int? bedrooms,
    int? bathrooms,
    String? sort,
    int? page,
  }) {
    return PropertyFilters(
      listingType: listingType ?? this.listingType,
      city: city ?? this.city,
      propertyType: propertyType ?? this.propertyType,
      minPrice: minPrice ?? this.minPrice,
      maxPrice: maxPrice ?? this.maxPrice,
      bedrooms: bedrooms ?? this.bedrooms,
      bathrooms: bathrooms ?? this.bathrooms,
      sort: sort ?? this.sort,
      page: page ?? this.page,
      limit: limit,
    );
  }

  Map<String, dynamic> toQuery() {
    final query = <String, dynamic>{'page': page, 'limit': limit};
    if (listingType != null) query['listingType'] = listingType;
    if (city != null && city!.isNotEmpty) query['city'] = city;
    if (propertyType != null && propertyType!.isNotEmpty) query['propertyType'] = propertyType;
    if (minPrice != null) query['minPrice'] = minPrice;
    if (maxPrice != null) query['maxPrice'] = maxPrice;
    if (bedrooms != null) query['bedrooms'] = bedrooms;
    if (bathrooms != null) query['bathrooms'] = bathrooms;
    if (sort != null) query['sort'] = sort;
    return query;
  }
}

class PropertyPage {
  final List<Property> properties;
  final int page;
  final int totalPages;
  final int total;

  PropertyPage({required this.properties, required this.page, required this.totalPages, required this.total});
}

class PropertyRepository {
  final ApiClient _client;
  PropertyRepository(this._client);

  Future<PropertyPage> search(PropertyFilters filters) async {
    final res = await _client.dio.get('/properties', queryParameters: filters.toQuery());
    final data = res.data as Map<String, dynamic>;
    final pagination = data['pagination'] as Map<String, dynamic>;
    return PropertyPage(
      properties: (data['properties'] as List).map((e) => Property.fromJson(e as Map<String, dynamic>)).toList(),
      page: pagination['page'] as int,
      totalPages: pagination['totalPages'] as int,
      total: pagination['total'] as int,
    );
  }

  Future<(Property, List<Property>)> getById(String id) async {
    final res = await _client.dio.get('/properties/$id');
    final data = res.data as Map<String, dynamic>;
    final property = Property.fromJson(data['property'] as Map<String, dynamic>);
    final similar =
        (data['similar'] as List).map((e) => Property.fromJson(e as Map<String, dynamic>)).toList();
    return (property, similar);
  }
}

final propertyRepositoryProvider =
    Provider<PropertyRepository>((ref) => PropertyRepository(ref.watch(apiClientProvider)));
