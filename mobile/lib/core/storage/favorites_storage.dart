import 'package:shared_preferences/shared_preferences.dart';

/// Device-local favorites for guests and for signed-in accounts that are not
/// customers (agents, owners, admins). Customers sync via FavoritesRepository
/// instead — see FavoritesController.
///
/// Each account has its own list ([owner] = the account id); guests share the
/// original key. One shared list used to show an owner's saves to whoever
/// signed in next on the same phone — saves that "weren't theirs".
class FavoritesStorage {
  FavoritesStorage._();
  static const _key = 'favorite_property_ids';

  static String _keyFor(String? owner) => owner == null ? _key : '$_key:$owner';

  static Future<Set<String>> getAll({String? owner}) async {
    final prefs = await SharedPreferences.getInstance();
    return (prefs.getStringList(_keyFor(owner)) ?? []).toSet();
  }

  static Future<bool> toggle(String propertyId, {String? owner}) async {
    final prefs = await SharedPreferences.getInstance();
    final ids = (prefs.getStringList(_keyFor(owner)) ?? []).toSet();
    late final bool isFavorite;
    if (ids.contains(propertyId)) {
      ids.remove(propertyId);
      isFavorite = false;
    } else {
      ids.add(propertyId);
      isFavorite = true;
    }
    await prefs.setStringList(_keyFor(owner), ids.toList());
    return isFavorite;
  }

  /// Drops listings that no longer exist (deleted, sold, unpublished).
  static Future<void> removeAll(Iterable<String> propertyIds, {String? owner}) async {
    final prefs = await SharedPreferences.getInstance();
    final ids = (prefs.getStringList(_keyFor(owner)) ?? []).toSet()..removeAll(propertyIds);
    await prefs.setStringList(_keyFor(owner), ids.toList());
  }

  /// Clears the guest list (after it was merged into a new customer account).
  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
