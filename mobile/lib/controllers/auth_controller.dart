import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/storage/token_storage.dart';
import '../models/agent.dart';
import '../repositories/auth_repository.dart';
import 'favorites_controller.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  final AuthStatus status;
  final Agent? agent;

  const AuthState({this.status = AuthStatus.unknown, this.agent});

  AuthState copyWith({AuthStatus? status, Agent? agent}) =>
      AuthState(status: status ?? this.status, agent: agent ?? this.agent);
}

class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() => const AuthState();

  Future<void> restoreSession() async {
    final token = await TokenStorage.readToken();
    if (token == null) {
      state = state.copyWith(status: AuthStatus.unauthenticated);
      return;
    }
    try {
      final agent = await ref.read(authRepositoryProvider).me();
      state = AuthState(status: AuthStatus.authenticated, agent: agent);
    } catch (_) {
      await TokenStorage.clearToken();
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<void> login(String email, String password) async {
    final (token, agent) = await ref.read(authRepositoryProvider).login(email, password);
    await TokenStorage.saveToken(token);
    state = AuthState(status: AuthStatus.authenticated, agent: agent);
    if (agent.isCustomer) await _mergeFavoritesIfCustomer();
  }

  Future<void> register({
    required String email,
    required String password,
    required String name,
    String role = 'AGENT',
    String? phone,
    String? title,
    String? location,
    int? yearsExperience,
    String? bio,
    List<String>? specializations,
  }) async {
    final (token, agent) = await ref.read(authRepositoryProvider).register(
          email: email,
          password: password,
          name: name,
          role: role,
          phone: phone,
          title: title,
          location: location,
          yearsExperience: yearsExperience,
          bio: bio,
          specializations: specializations,
        );
    await TokenStorage.saveToken(token);
    state = AuthState(status: AuthStatus.authenticated, agent: agent);
    if (agent.isCustomer) await _mergeFavoritesIfCustomer();
  }

  Future<void> _mergeFavoritesIfCustomer() async {
    try {
      await ref.read(favoritesControllerProvider.notifier).mergeLocalIntoServer();
    } catch (_) {
      // Non-fatal: the favorites screen will just retry loading from the server later.
    }
  }

  void updateAgent(Agent agent) {
    state = state.copyWith(agent: agent);
  }

  Future<void> logout() async {
    await TokenStorage.clearToken();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }
}

final authControllerProvider = NotifierProvider<AuthController, AuthState>(AuthController.new);
