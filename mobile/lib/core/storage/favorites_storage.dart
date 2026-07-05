import 'package:shared_preferences/shared_preferences.dart';

/// Favorites are local-only: the site has no consumer account system today
/// (only Agent logins), so there is nothing on the server to sync against.
class FavoritesStorage {
  FavoritesStorage._();
  static const _key = 'favorite_property_ids';

  static Future<Set<String>> getAll() async {
    final prefs = await SharedPreferences.getInstance();
    return (prefs.getStringList(_key) ?? []).toSet();
  }

  static Future<bool> toggle(String propertyId) async {
    final prefs = await SharedPreferences.getInstance();
    final ids = (prefs.getStringList(_key) ?? []).toSet();
    late final bool isFavorite;
    if (ids.contains(propertyId)) {
      ids.remove(propertyId);
      isFavorite = false;
    } else {
      ids.add(propertyId);
      isFavorite = true;
    }
    await prefs.setStringList(_key, ids.toList());
    return isFavorite;
  }
}
