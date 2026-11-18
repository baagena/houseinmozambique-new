import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/storage/favorites_storage.dart';
import '../repositories/favorites_repository.dart';
import 'auth_controller.dart';
import '../services/firebase_services.dart';

/// The ids of the listings this person has saved.
///
/// Customers: synced with their account on the server. Everyone else: kept on
/// the phone, one list per account (guests share one), so a different account
/// signing in never sees someone else's saves.
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

  /// The local list's owner: the signed-in account, or null for a guest.
  String? get _owner => ref.read(authControllerProvider).agent?.id;

  Future<void> _loadFromLocal() async {
    state = await FavoritesStorage.getAll(owner: _owner);
  }

  Future<void> _loadFromServer() async {
    try {
      state = await ref.read(favoritesRepositoryProvider).list();
    } catch (_) {
      // Leave state empty rather than crash; the favorites screen has its own retry.
    }
  }

  Future<void> toggle(String propertyId) async {
    Analytics.favorite(!state.contains(propertyId));
    if (!_isCustomer) {
      await FavoritesStorage.toggle(propertyId, owner: _owner);
      state = await FavoritesStorage.getAll(owner: _owner);
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

  /// Removes saved listings that no longer exist (deleted, sold or
  /// unpublished), so the saved count matches what the list can show.
  Future<void> forget(Set<String> propertyIds) async {
    if (propertyIds.isEmpty) return;
    state = {...state}..removeAll(propertyIds);
    if (!_isCustomer) {
      await FavoritesStorage.removeAll(propertyIds, owner: _owner);
      return;
    }
    final repo = ref.read(favoritesRepositoryProvider);
    for (final id in propertyIds) {
      try {
        await repo.remove(id);
      } catch (_) {
        // Already gone on the server too — nothing to undo.
      }
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
