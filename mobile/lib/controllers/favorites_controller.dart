import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/storage/favorites_storage.dart';
import '../repositories/favorites_repository.dart';
import 'auth_controller.dart';

class FavoritesController extends Notifier<Set<String>> {
  @override
  Set<String> build() {
    final agent = ref.watch(authControllerProvider).agent;
    if (agent?.isCustomer == true) {
      _loadFromServer();
    } else {
      _loadFromLocal();
    }
    return {};
  }

  bool get _isCustomer => ref.read(authControllerProvider).agent?.isCustomer == true;

  Future<void> _loadFromLocal() async {
    state = await FavoritesStorage.getAll();
  }

  Future<void> _loadFromServer() async {
    try {
      state = await ref.read(favoritesRepositoryProvider).list();
    } catch (_) {
      // Leave state empty rather than crash; the favorites screen has its own retry.
    }
  }

  Future<void> toggle(String propertyId) async {
    if (!_isCustomer) {
      await FavoritesStorage.toggle(propertyId);
      state = await FavoritesStorage.getAll();
      return;
    }

    final wasFavorite = state.contains(propertyId);
    state = wasFavorite ? ({...state}..remove(propertyId)) : ({...state}..add(propertyId));
    try {
      final repo = ref.read(favoritesRepositoryProvider);
      if (wasFavorite) {
        await repo.remove(propertyId);
      } else {
        await repo.add(propertyId);
      }
    } catch (_) {
      state = wasFavorite ? ({...state}..add(propertyId)) : ({...state}..remove(propertyId));
    }
  }

  bool isFavorite(String propertyId) => state.contains(propertyId);

  /// Called once right after a guest signs in or registers as a customer, to
  /// upload whatever they'd favorited locally before having an account.
  Future<void> mergeLocalIntoServer() async {
    final localIds = await FavoritesStorage.getAll();
    state = await ref.read(favoritesRepositoryProvider).merge(localIds);
    await FavoritesStorage.clear();
  }
}

final favoritesControllerProvider = NotifierProvider<FavoritesController, Set<String>>(FavoritesController.new);
