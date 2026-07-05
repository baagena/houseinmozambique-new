import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/storage/favorites_storage.dart';

class FavoritesController extends Notifier<Set<String>> {
  @override
  Set<String> build() {
    _load();
    return {};
  }

  Future<void> _load() async {
    state = await FavoritesStorage.getAll();
  }

  Future<void> toggle(String propertyId) async {
    await FavoritesStorage.toggle(propertyId);
    state = await FavoritesStorage.getAll();
  }

  bool isFavorite(String propertyId) => state.contains(propertyId);
}

final favoritesControllerProvider = NotifierProvider<FavoritesController, Set<String>>(FavoritesController.new);
