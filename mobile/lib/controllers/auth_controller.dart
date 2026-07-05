import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/storage/token_storage.dart';
import '../models/agent.dart';
import '../repositories/auth_repository.dart';

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
  }

  Future<void> register({
    required String email,
    required String password,
    required String name,
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
          title: title,
          location: location,
          yearsExperience: yearsExperience,
          bio: bio,
          specializations: specializations,
        );
    await TokenStorage.saveToken(token);
    state = AuthState(status: AuthStatus.authenticated, agent: agent);
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
